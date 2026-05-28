<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, ColumnFiltersState, FilterFn, SortingState, VisibilityState, ExpandedState, GroupingState } from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'

// `valueUpdater` lives next to the low-level table primitive (which
// data-table depends on transitively via registryDependencies). Keep
// `@/lib/utils` reserved for the cn() helper shipped by the init
// bootstrap -- importing valueUpdater from there would force every
// consumer to hand-edit lib/utils.ts on install.
import { valueUpdater } from '@/components/ui/table/utils'
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { CalendarDate, type DateValue } from '@internationalized/date'
import type { DateRange as RekaDateRange } from 'reka-ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import DataTableToolbar from './DataTableToolbar.vue'
import DataTableFilterSheet from './DataTableFilterSheet.vue'
import DataTablePagination from './DataTablePagination.vue'

export interface FilterOption {
  value: string
  label: string
  icon?: any
}

export interface FilterDefinition {
  column: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'date'
  options?: (string | FilterOption)[]
}

interface DateRange {
  from?: string
  to?: string
}

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterColumn?: string
    filterPlaceholder?: string
    filters?: FilterDefinition[]
    filterMode?: 'inline' | 'modal' | 'popover'
    /** Show the global search input. Default true. */
    enableSearch?: boolean
    /** Show the View column-visibility dropdown. Default true. */
    enableColumnVisibility?: boolean
    /** Show the pagination footer. Default true. */
    enablePagination?: boolean
    /** Hide the entire toolbar (search + filters + view). Default false. */
    hideToolbar?: boolean
    /** Show Export-CSV button in toolbar. Default false. */
    enableExport?: boolean
    /** Infinite-scroll mode: emits `fetch-more` when last row enters viewport,
     *  hides the pagination footer. Combine with append-on-success on the
     *  consumer side. */
    infinite?: boolean
    /** Allow drag-to-resize on column borders. */
    enableResize?: boolean
    /** Initial column pinning. Each column id is pinned to the given side. */
    defaultColumnPinning?: { left?: string[], right?: string[] }
    /** Allow drag-to-reorder on column headers. */
    enableReorder?: boolean
    /** Initial column ids to group by. Pass an empty array to disable grouping. */
    defaultGrouping?: string[]
    /** Virtual-scrolling mode (CSS content-visibility based). Best with large
     *  datasets and `max-height` for a scroll container. */
    virtual?: boolean
    /** Sticky header — keeps `<thead>` visible when scrolling. Pair with `max-height`. */
    stickyHeader?: boolean
    /** Density of cell padding: 'compact' | 'cozy' | 'comfortable'. Default cozy.
     *  Treated as the INITIAL density when `enableDensityToggle` is on; the user
     *  can override it at runtime from the toolbar. */
    density?: 'compact' | 'cozy' | 'comfortable'
    /** Show the density toggle in the toolbar. Default false. */
    enableDensityToggle?: boolean
    /** Strip the DataTable's borders.
     *  - `'inner'` removes toolbar bottom-divider, pagination top-divider,
     *    and filter-sheet section bgs/borders. The outer container border
     *    is kept.
     *  - `'full'` additionally removes the outer container border + rounded
     *    corners so the table renders completely flat on the canvas. */
    borderless?: 'inner' | 'full'
    /** Where the toolbar (search / filters / export / view) renders.
     *  - `'inside'` (default) is the canonical layout: toolbar lives inside
     *    the bordered container above the table, separated by a divider.
     *  - `'above'` floats the toolbar outside the bordered container, so
     *    the table's border only wraps the table (and pagination unless
     *    that is also moved out). Useful when you want the chrome to
     *    feel like a page action bar rather than card-internal. */
    toolbarPosition?: 'inside' | 'above'
    /** Where the pagination footer renders.
     *  - `'inside'` (default): footer sits inside the bordered container,
     *    separated by a top-divider.
     *  - `'below'` floats the footer outside the bordered container. */
    paginationPosition?: 'inside' | 'below'
    /** Max height; enables vertical scroll inside the card. */
    maxHeight?: string
    /** Row click — when set, rows become clickable + cursor-pointer. */
    onRowClick?: (row: TData) => void
    /** Server-side mode: total row count from API (enables manual pagination) */
    totalRows?: number
    /** Server-side mode: loading state indicator */
    loading?: boolean
  }>(),
  {
    filterColumn: '',
    filterPlaceholder: 'Filter...',
    filters: () => [],
    filterMode: 'modal',
    enableSearch: true,
    enableColumnVisibility: false,
    enablePagination: true,
    hideToolbar: false,
    enableExport: false,
    infinite: false,
    enableResize: false,
    defaultColumnPinning: () => ({ left: [], right: [] }),
    enableReorder: false,
    defaultGrouping: () => [],
    virtual: false,
    stickyHeader: false,
    density: 'cozy',
    enableDensityToggle: false,
    toolbarPosition: 'inside',
    paginationPosition: 'inside',
    maxHeight: '',
    totalRows: -1,
    loading: false,
  },
)

// User-mutable density -- initial value from prop, toggleable via toolbar
// when `enableDensityToggle` is on. Watch the prop so parents can still
// drive it externally (e.g. saving the user's last choice to a setting).
const currentDensity = ref<'compact' | 'cozy' | 'comfortable'>(props.density)
watch(() => props.density, (v) => { currentDensity.value = v })

// `borderless` is an enum at the DataTable level (`'inner'` vs `'full'`), but
// child components only need to know "should I drop my borders?" -- collapse
// to a single boolean for the pass-through.
const dropInnerBorders = computed(() => !!props.borderless)

const densityClass = computed(() => {
  if (currentDensity.value === 'compact') return '[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs [&_th]:h-8 [&_th]:px-3 [&_th]:text-xs'
  if (currentDensity.value === 'comfortable') return '[&_td]:py-3 [&_th]:h-12'
  // cozy -- 8px vertical cell padding, 40px header. Tightens the
  // TableCell/TableHead defaults (py-3 / h-12) so a cozy DataTable
  // doesn't feel airy compared with the surrounding canvas.
  return '[&_td]:py-2 [&_th]:h-10'
})

const emit = defineEmits<{
  /** Emitted when server-side state changes (pagination, sorting, filters) */
  (
    e: 'update:state',
    state: {
      page: number
      pageSize: number
      sortBy: string
      sortOrder: 'asc' | 'desc'
      filters: Record<string, any>
      search: string
    },
  ): void
  /** Infinite-scroll: last row entered viewport, time to load more */
  (e: 'fetch-more'): void
}>()

const isServerSide = computed(() => props.totalRows >= 0)
const isFilterSheetOpen = ref(false)

// ── Filter snapshot (restore on close without apply) ─────────────────────────
// Shared between the modal Sheet and the inline Popover. Both surfaces stage
// edits in the live `columnFilters` ref (so the in-popover "N selected"
// badges update as the user clicks). Closing without hitting Apply rolls
// back via the snapshot.
let filterSnapshot: ColumnFiltersState | null = null
let dateRangeSnapshot: Record<string, RekaDateRange> | null = null
let filterApplied = false

function snapshotFilters() {
  filterApplied = false
  filterSnapshot = JSON.parse(JSON.stringify(columnFilters.value))
  dateRangeSnapshot = JSON.parse(JSON.stringify(dateRangeModels.value))
}

function maybeRestoreFilters() {
  if (!filterApplied && filterSnapshot) {
    columnFilters.value = filterSnapshot
    dateRangeModels.value = dateRangeSnapshot ?? {}
  }
  filterSnapshot = null
  dateRangeSnapshot = null
}

function onFilterSheetOpen() {
  snapshotFilters()
  isFilterSheetOpen.value = true
}

function onFilterSheetClose(open: boolean) {
  if (!open) maybeRestoreFilters()
  isFilterSheetOpen.value = open
}

// ── Timers for debounce / batching ──────────────────────────────────────────
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
let paginationEmitTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput(val: string) {
  if (!props.filterColumn || !table.getColumn(props.filterColumn)) return
  table.getColumn(props.filterColumn)?.setFilterValue(val || undefined)
  if (isServerSide.value) {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      table.setPageIndex(0)
      emitStateUpdate()
    }, 500)
  }
}

// Custom filter functions for multiselect and date range
const multiSelectFilterFn: FilterFn<TData> = (row, columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true
  const cellValue = String(row.getValue(columnId)).toLowerCase()
  return filterValue.some((v: string) => v.toLowerCase() === cellValue)
}

const dateRangeFilterFn: FilterFn<TData> = (row, columnId, filterValue: DateRange) => {
  if (!filterValue) return true
  const { from, to } = filterValue
  if (!from && !to) return true
  const cellValue = String(row.getValue(columnId))
  if (from && cellValue < from) return false
  if (to && cellValue > to) return false
  return true
}

// Augment columns with custom filter functions based on filter definitions
const processedColumns = computed(() => {
  return props.columns.map((col) => {
    const colId = (col as any).accessorKey || (col as any).id
    const filter = props.filters.find(f => f.column === colId)
    if (!filter) return col
    if (filter.type === 'multiselect') return { ...col, filterFn: multiSelectFilterFn }
    if (filter.type === 'date') return { ...col, filterFn: dateRangeFilterFn }
    return col
  })
})

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})
const columnPinning = ref({
  left: props.defaultColumnPinning.left ?? [],
  right: props.defaultColumnPinning.right ?? [],
})
const columnOrder = ref<string[]>([])
const grouping = ref<GroupingState>(props.defaultGrouping)
const pagination = ref({ pageIndex: 0, pageSize: 10 })

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return processedColumns.value
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: isServerSide.value ? undefined : getPaginationRowModel(),
  getSortedRowModel: isServerSide.value ? undefined : getSortedRowModel(),
  getFilteredRowModel: isServerSide.value ? undefined : getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  get enableColumnResizing() {
    return props.enableResize
  },
  columnResizeMode: 'onChange',
  get manualPagination() {
    return isServerSide.value
  },
  get manualSorting() {
    return isServerSide.value
  },
  get manualFiltering() {
    return isServerSide.value
  },
  get rowCount() {
    return isServerSide.value ? props.totalRows : undefined
  },
  onSortingChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, sorting)
    if (isServerSide.value) emitStateUpdate()
  },
  onColumnFiltersChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnFilters)
    // Server-side: never auto-emit on filter change — handled by Apply button / search debounce
    // Client-side inline: filters apply locally via TanStack, no emit needed
  },
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onPaginationChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, pagination)
    if (isServerSide.value) {
      // Debounce to batch rapid pagination changes (e.g. setPageSize + setPageIndex)
      if (paginationEmitTimer) clearTimeout(paginationEmitTimer)
      paginationEmitTimer = setTimeout(() => emitStateUpdate(), 0)
    }
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get pagination() {
      return pagination.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get expanded() {
      return expanded.value
    },
    get columnPinning() {
      return columnPinning.value
    },
    get columnOrder() {
      return columnOrder.value
    },
    get grouping() {
      return grouping.value
    },
  },
  onColumnPinningChange: updaterOrValue => valueUpdater(updaterOrValue, columnPinning),
  onColumnOrderChange: updaterOrValue => valueUpdater(updaterOrValue, columnOrder),
  onGroupingChange: updaterOrValue => valueUpdater(updaterOrValue, grouping),
})

/** Build and emit current server-side state */
function emitStateUpdate() {
  const s = sorting.value[0]
  const filterMap: Record<string, any> = {}
  for (const cf of columnFilters.value) {
    filterMap[cf.id] = cf.value
  }
  emit('update:state', {
    page: table.getState().pagination.pageIndex + 1,
    pageSize: table.getState().pagination.pageSize,
    sortBy: s?.id || '',
    sortOrder: s?.desc ? 'desc' : 'asc',
    filters: filterMap,
    search: (props.filterColumn && (table.getColumn(props.filterColumn)?.getFilterValue() as string)) || '',
  })
}

// ── Filter helpers ───────────────────────────────────────────────────────────

function getMultiSelectValue(column: string): string[] {
  return (table.getColumn(column)?.getFilterValue() as string[]) ?? []
}

function getDateRangeValue(column: string): DateRange {
  return (table.getColumn(column)?.getFilterValue() as DateRange) ?? {}
}

// ── Date conversion helpers ──────────────────────────────────────────────────

function stringToDateValue(str: string): DateValue | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  if (y === undefined || m === undefined || d === undefined) return undefined
  return new CalendarDate(y, m, d)
}

function dateValueToString(dv: DateValue | undefined): string {
  if (!dv) return ''
  return `${dv.year}-${String(dv.month).padStart(2, '0')}-${String(dv.day).padStart(2, '0')}`
}

/** Per-filter reactive range calendar model, keyed by column name */
const dateRangeModels = ref<Record<string, RekaDateRange>>({})

function getCalendarModel(column: string): RekaDateRange {
  if (!dateRangeModels.value[column]) {
    const dr = getDateRangeValue(column)
    dateRangeModels.value[column] = {
      start: stringToDateValue(dr.from ?? '') as DateValue,
      end: stringToDateValue(dr.to ?? '') as DateValue,
    }
  }
  return dateRangeModels.value[column]
}

function onCalendarUpdate(column: string, val: RekaDateRange) {
  dateRangeModels.value[column] = val
  const from = val.start ? dateValueToString(val.start) : undefined
  const to = val.end ? dateValueToString(val.end) : undefined
  const hasValue = from || to
  table.getColumn(column)?.setFilterValue(hasValue ? { from, to } : undefined)
}

function formatDateRange(column: string): string {
  const dr = getDateRangeValue(column)
  if (dr.from && dr.to) return `${dr.from} - ${dr.to}`
  if (dr.from) return `From ${dr.from}`
  if (dr.to) return `Until ${dr.to}`
  return ''
}

function toggleMultiSelectValue(column: string, option: string) {
  const current = getMultiSelectValue(column)
  const next = current.includes(option) ? current.filter(v => v !== option) : [...current, option]
  table.getColumn(column)?.setFilterValue(next.length > 0 ? next : undefined)
}

function clearAllFilters() {
  filterApplied = true
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  props.filters.forEach((f) => {
    table.getColumn(f.column)?.setFilterValue(undefined)
    if (f.type === 'date') {
      dateRangeModels.value[f.column] = { start: undefined as any, end: undefined as any }
    }
  })
  if (props.filterColumn && table.getColumn(props.filterColumn)) {
    table.getColumn(props.filterColumn)?.setFilterValue(undefined)
  }
  if (isServerSide.value) {
    table.setPageIndex(0)
    nextTick(() => emitStateUpdate())
  }
}

function isFilterActive(filter: FilterDefinition): boolean {
  const value = table.getColumn(filter.column)?.getFilterValue()
  if (value === undefined || value === '') return false
  if (filter.type === 'multiselect') return Array.isArray(value) && value.length > 0
  if (filter.type === 'date') {
    const d = value as DateRange
    return !!(d.from || d.to)
  }
  return true
}

const isAnyFilterActive = computed(() => {
  const hasSearchValue = !!(props.filterColumn && (table.getColumn(props.filterColumn)?.getFilterValue() as string))
  return hasSearchValue || props.filters.some(isFilterActive)
})

function getFilterSelectedLabels(filter: FilterDefinition): string[] {
  const vals = getMultiSelectValue(filter.column)
  return vals.map((v) => {
    const opt = filter.options?.find(o => resolveOption(o).value === v)
    return opt ? resolveOption(opt).label : v
  })
}

function resolveOption(opt: string | FilterOption): FilterOption {
  if (typeof opt === 'string') return { value: opt, label: opt }
  return opt
}

function clearFilter(filter: FilterDefinition) {
  table.getColumn(filter.column)?.setFilterValue(undefined)
}

const activeFilterCount = computed(() => {
  return props.filters.filter(isFilterActive).length
})

function clearDateFilter(filter: FilterDefinition) {
  clearFilter(filter)
  dateRangeModels.value[filter.column] = { start: undefined as any, end: undefined as any }
}

function onApplyFilters() {
  filterApplied = true
  if (isServerSide.value) {
    if (table.getState().pagination.pageIndex === 0) {
      emitStateUpdate()
    }
    else {
      table.setPageIndex(0)
    }
  }
  isFilterSheetOpen.value = false
}

/**
 * Popover filter mode: handle the staged-edit commit. The popover never
 * mutates `columnFilters` during interaction — it builds a draft locally
 * and emits it here on Apply. Walk the draft, write each column's value
 * via `setFilterValue`, and sync the calendar model for date filters so
 * a subsequent reopen reflects the just-applied range.
 */
function onCommitDraft(draft: Record<string, any>) {
  for (const f of props.filters) {
    if (!(f.column in draft)) continue
    const val = draft[f.column]
    if (f.type === 'date') {
      const dr = (val ?? {}) as DateRange
      dateRangeModels.value[f.column] = {
        start: stringToDateValue(dr.from ?? '') as DateValue,
        end: stringToDateValue(dr.to ?? '') as DateValue,
      }
      table.getColumn(f.column)?.setFilterValue(val)
    }
    else {
      table.getColumn(f.column)?.setFilterValue(val)
    }
  }
  // Reuse the same apply-side bookkeeping (server-side re-fetch +
  // pagination reset). filterApplied flips so any stale Sheet snapshot
  // doesn't try to roll back.
  onApplyFilters()
}

// Column reorder — HTML5 drag/drop swaps the dragged column with the drop target.
const dragColId = ref<string | null>(null)
const dragOverColId = ref<string | null>(null)

function onColDragStart(id: string, e: DragEvent) {
  dragColId.value = id
  document.body.style.cursor = 'grabbing'
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onColDragOver(targetId: string, e: DragEvent) {
  if (!props.enableReorder || !dragColId.value) return
  e.preventDefault()
  dragOverColId.value = targetId
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onColDragEnd() {
  document.body.style.cursor = ''
  dragColId.value = null
  dragOverColId.value = null
}

function onColDrop(targetId: string) {
  const src = dragColId.value
  onColDragEnd()
  if (!src || src === targetId) return
  const order = (columnOrder.value.length ? columnOrder.value : table.getAllLeafColumns().map(c => c.id)).slice()
  const from = order.indexOf(src)
  const to = order.indexOf(targetId)
  if (from === -1 || to === -1) return
  order.splice(to, 0, ...order.splice(from, 1))
  columnOrder.value = order
}

// Pinning — return style for sticky pinned cells (header or body)
function pinStyle(col: any): Record<string, string> | undefined {
  const side = col.getIsPinned()
  if (!side) return undefined
  if (side === 'left') return { position: 'sticky', left: `${col.getStart('left')}px`, zIndex: '2' }
  return { position: 'sticky', right: `${col.getAfter('right')}px`, zIndex: '2' }
}

// Infinite scroll — sentinel row triggers fetch-more when visible
const sentinelEl = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (!props.infinite || !sentinelEl.value) return
  io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) emit('fetch-more')
    },
    { rootMargin: '100px' },
  )
  io.observe(sentinelEl.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  io = null
})

watch(
  () => props.infinite,
  (on) => {
    if (on && sentinelEl.value && !io) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) emit('fetch-more')
        },
        { rootMargin: '100px' },
      )
      io.observe(sentinelEl.value)
    }
    else if (!on) {
      io?.disconnect()
      io = null
    }
  },
)

// CSV export — uses currently filtered + visible data, skips select/actions cols.
function exportCsv() {
  const visibleCols = table
    .getVisibleLeafColumns()
    .filter(c => c.id !== 'select' && c.id !== 'actions' && c.id !== 'expander')
  const headers = visibleCols.map(c =>
    String(c.columnDef.header && typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id),
  )
  const rows = table.getFilteredRowModel().rows.map(row =>
    visibleCols.map((c) => {
      const v = row.getValue(c.id)
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }),
  )
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// JSON export -- same row/column scope as CSV, but emits the underlying
// row.original objects so downstream tools get typed data, not strings.
function exportJson() {
  const visibleColIds = table
    .getVisibleLeafColumns()
    .filter(c => c.id !== 'select' && c.id !== 'actions' && c.id !== 'expander')
    .map(c => c.id)
  const rows = table.getFilteredRowModel().rows.map((row) => {
    const original = row.original as Record<string, unknown>
    // When the page projects via accessorKey, original keys match. When it
    // uses accessorFn (eg. a synthesized "name" column), surface that under
    // the column id so consumers see the same shape they exported.
    const out: Record<string, unknown> = {}
    for (const id of visibleColIds) {
      out[id] = id in original ? original[id] : row.getValue(id)
    }
    return out
  })
  const json = JSON.stringify(rows, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

defineExpose({ table, exportCsv, exportJson })
</script>

<template>
  <!-- ClientOnly: the TanStack table renders identically on server and client
       in principle, but its interactive Reka-based controls resolve internal
       state in the browser, producing benign hydration mismatches. The table is
       behind auth on mock data, so SSR adds no value here. -->
  <ClientOnly>
    <div
      data-uipkge
      data-slot="data-table"
      class="w-full"
    >
      <!-- Toolbar (above-mode: floats outside the bordered card, no
         bottom-divider since nothing sits directly below it inside the
         same surface). -->
      <DataTableToolbar
        v-if="!hideToolbar && toolbarPosition === 'above'"
        :table="table"
        :filter-column="filterColumn"
        :filter-placeholder="filterPlaceholder"
        :filters="filters"
        :filter-mode="filterMode"
        :enable-search="enableSearch"
        :enable-column-visibility="enableColumnVisibility"
        :enable-export="enableExport"
        :enable-density-toggle="enableDensityToggle"
        :density="currentDensity"
        :borderless="true"
        :active-filter-count="activeFilterCount"
        :is-any-filter-active="isAnyFilterActive"
        :is-server-side="isServerSide"
        :get-multi-select-value="getMultiSelectValue"
        :get-date-range-value="getDateRangeValue"
        :get-filter-selected-labels="getFilterSelectedLabels"
        :format-date-range="formatDateRange"
        :get-calendar-model="getCalendarModel"
        @search="onSearchInput"
        @open-filter-sheet="onFilterSheetOpen"
        @apply-filters="onApplyFilters"
        @clear-all-filters="clearAllFilters"
        @toggle-multiselect="toggleMultiSelectValue"
        @clear-filter="clearFilter"
        @clear-date-filter="clearDateFilter"
        @calendar-update="onCalendarUpdate"
        @text-filter-update="(col, val) => table.getColumn(col)?.setFilterValue(val)"
        @commit-filters="onCommitDraft"
        @export-csv="exportCsv"
        @export-json="exportJson"
        @update:density="(d: 'compact' | 'cozy' | 'comfortable') => (currentDensity = d)"
      >
        <template
          v-if="$slots['toolbar-extra']"
          #toolbar-extra
        >
          <slot
            name="toolbar-extra"
            :table="table"
          />
        </template>
        <template
          v-if="$slots['custom-filters']"
          #custom-filters
        >
          <slot
            name="custom-filters"
            :table="table"
          />
        </template>
      </DataTableToolbar>

      <div
        :class="[
          'bg-card text-card-foreground overflow-hidden',
          borderless === 'full' ? '' : 'rounded-md border',
        ]"
      >
        <!-- Toolbar (inside-mode, default): canonical card layout, toolbar
           sits at the top of the bordered card with its bottom-divider. -->
        <DataTableToolbar
          v-if="!hideToolbar && toolbarPosition === 'inside'"
          :table="table"
          :filter-column="filterColumn"
          :filter-placeholder="filterPlaceholder"
          :filters="filters"
          :filter-mode="filterMode"
          :enable-search="enableSearch"
          :enable-column-visibility="enableColumnVisibility"
          :enable-export="enableExport"
          :enable-density-toggle="enableDensityToggle"
          :density="currentDensity"
          :borderless="dropInnerBorders"
          :active-filter-count="activeFilterCount"
          :is-any-filter-active="isAnyFilterActive"
          :is-server-side="isServerSide"
          :get-multi-select-value="getMultiSelectValue"
          :get-date-range-value="getDateRangeValue"
          :get-filter-selected-labels="getFilterSelectedLabels"
          :format-date-range="formatDateRange"
          :get-calendar-model="getCalendarModel"
          @search="onSearchInput"
          @open-filter-sheet="onFilterSheetOpen"
          @apply-filters="onApplyFilters"
          @clear-all-filters="clearAllFilters"
          @toggle-multiselect="toggleMultiSelectValue"
          @clear-filter="clearFilter"
          @clear-date-filter="clearDateFilter"
          @calendar-update="onCalendarUpdate"
          @text-filter-update="(col, val) => table.getColumn(col)?.setFilterValue(val)"
          @commit-filters="onCommitDraft"
          @export-csv="exportCsv"
          @export-json="exportJson"
          @update:density="(d: 'compact' | 'cozy' | 'comfortable') => (currentDensity = d)"
        >
          <template
            v-if="$slots['toolbar-extra']"
            #toolbar-extra
          >
            <slot
              name="toolbar-extra"
              :table="table"
            />
          </template>
          <template
            v-if="$slots['custom-filters']"
            #custom-filters
          >
            <slot
              name="custom-filters"
              :table="table"
            />
          </template>
        </DataTableToolbar>

        <!-- Filter Sheet (modal mode) -->
        <DataTableFilterSheet
          :open="isFilterSheetOpen"
          :table="table"
          :filters="filters"
          :active-filter-count="activeFilterCount"
          :is-any-filter-active="isAnyFilterActive"
          :is-server-side="isServerSide"
          :borderless="dropInnerBorders"
          :get-multi-select-value="getMultiSelectValue"
          :get-date-range-value="getDateRangeValue"
          :format-date-range="formatDateRange"
          :get-calendar-model="getCalendarModel"
          @update:open="onFilterSheetClose"
          @apply="onApplyFilters"
          @clear-all="clearAllFilters"
          @toggle-multiselect="toggleMultiSelectValue"
          @clear-filter="clearFilter"
          @clear-date-filter="clearDateFilter"
          @calendar-update="onCalendarUpdate"
          @text-filter-update="(col, val) => table.getColumn(col)?.setFilterValue(val)"
        >
          <template
            v-if="$slots['custom-filters']"
            #custom-filters
          >
            <slot
              name="custom-filters"
              :table="table"
            />
          </template>
        </DataTableFilterSheet>

        <!-- Bulk action bar (slot above table when rows selected) -->
        <div
          v-if="$slots['bulk-actions'] && table.getSelectedRowModel().rows.length > 0"
          class="bg-muted/40 flex items-center gap-3 border-b px-4 py-2"
        >
          <span class="text-sm font-medium"> {{ table.getSelectedRowModel().rows.length }} selected </span>
          <slot
            name="bulk-actions"
            :rows="table.getSelectedRowModel().rows"
            :clear="() => table.toggleAllRowsSelected(false)"
          />
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground ml-auto text-xs transition"
            @click="table.toggleAllRowsSelected(false)"
          >
            Clear selection
          </button>
        </div>

        <!-- Table.
         The Table primitive wraps the <table> in its own overflow-auto div
         which would normally trap sticky-positioned children + draw native
         scrollbars. Neutralize that inner overflow and let
         OverlayScrollbarsComponent own both axes so we get a single,
         themed, auto-hiding pair of scrollbars across the whole region. -->
        <div
          v-os-scroll
          :class="[densityClass, 'relative [&_[data-slot=table-container]]:overflow-visible']"
          :style="maxHeight ? `max-height: ${maxHeight}` : ''"
        >
          <!-- Loading overlay -->
          <div
            v-if="loading"
            class="bg-card/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]"
          >
            <div class="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
          <Table>
            <TableHeader :class="stickyHeader ? 'bg-muted/95 sticky top-0 z-10 backdrop-blur-sm' : ''">
              <TableRow
                v-for="headerGroup in table.getHeaderGroups()"
                :key="headerGroup.id"
              >
                <TableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  class="relative transition-colors duration-150"
                  :class="[
                    enableReorder
                      && header.column.id !== 'select'
                      && header.column.id !== 'actions'
                      && header.column.id !== 'expander'
                      ? 'cursor-grab active:cursor-grabbing'
                      : '',
                    dragColId === header.column.id ? 'opacity-50' : '',
                    dragOverColId === header.column.id && dragColId !== header.column.id
                      ? 'border-foreground/60 border-l-2'
                      : '',
                  ]"
                  :style="{
                    ...(enableResize ? { width: `${header.getSize()}px` } : {}),
                    ...(pinStyle(header.column) ?? {}),
                  }"
                  :draggable="
                    enableReorder
                      && header.column.id !== 'select'
                      && header.column.id !== 'actions'
                      && header.column.id !== 'expander'
                  "
                  @dragstart="enableReorder ? onColDragStart(header.column.id, $event) : undefined"
                  @dragover="enableReorder ? onColDragOver(header.column.id, $event) : undefined"
                  @dragend="enableReorder ? onColDragEnd() : undefined"
                  @drop="enableReorder ? onColDrop(header.column.id) : undefined"
                >
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <div
                    v-if="enableResize && header.column.getCanResize()"
                    class="hover:bg-foreground/30 absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none transition-colors select-none"
                    :class="header.column.getIsResizing() ? 'bg-foreground/60' : ''"
                    @mousedown="header.getResizeHandler()?.($event)"
                    @touchstart="header.getResizeHandler()?.($event)"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="table.getRowModel().rows?.length">
                <template
                  v-for="row in table.getRowModel().rows"
                  :key="row.id"
                >
                  <TableRow
                    :data-state="row.getIsSelected() ? 'selected' : undefined"
                    :class="onRowClick ? 'hover:bg-muted/40 cursor-pointer' : ''"
                    :style="virtual ? 'content-visibility: auto; contain-intrinsic-size: auto 48px;' : undefined"
                    @click="onRowClick?.(row.original)"
                  >
                    <TableCell
                      v-for="cell in row.getVisibleCells()"
                      :key="cell.id"
                      class="bg-card"
                      :style="pinStyle(cell.column)"
                    >
                      <FlexRender
                        :render="cell.column.columnDef.cell"
                        :props="cell.getContext()"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow
                    v-if="row.getIsExpanded() && $slots.expanded"
                    :key="`${row.id}-expanded`"
                  >
                    <TableCell
                      :colspan="row.getVisibleCells().length"
                      class="bg-muted/30 px-6 py-4"
                    >
                      <slot
                        name="expanded"
                        :row="row.original"
                        :tanstack-row="row"
                      />
                    </TableCell>
                  </TableRow>
                </template>
              </template>
              <template v-else>
                <TableRow>
                  <TableCell
                    :colspan="columns.length"
                    class="h-24 text-center"
                  >
                    <slot name="empty">
                      <div class="text-muted-foreground text-sm">
                        No results.
                      </div>
                    </slot>
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
            <tfoot
              v-if="$slots.footer"
              class="bg-muted/20 sticky bottom-0 border-t"
            >
              <slot
                name="footer"
                :rows="table.getRowModel().rows"
              />
            </tfoot>
          </Table>
          <!-- Infinite scroll sentinel -->
          <div
            v-if="infinite"
            ref="sentinelEl"
            class="h-1"
          />
          <div
            v-if="infinite && loading"
            class="border-border text-muted-foreground border-t px-4 py-3 text-center text-sm"
          >
            Loading more…
          </div>
        </div>

        <!-- Pagination (inside-mode, default) -->
        <DataTablePagination
          v-if="enablePagination && !infinite && paginationPosition === 'inside'"
          :table="table"
          :total-rows="totalRows"
          :is-server-side="isServerSide"
          :borderless="dropInnerBorders"
        />
      </div>

      <!-- Pagination (below-mode: floats outside the bordered card,
         dividerless since nothing sits directly above it on the same surface). -->
      <DataTablePagination
        v-if="enablePagination && !infinite && paginationPosition === 'below'"
        :table="table"
        :total-rows="totalRows"
        :is-server-side="isServerSide"
        :borderless="true"
      />
    </div>
  </ClientOnly>
</template>
