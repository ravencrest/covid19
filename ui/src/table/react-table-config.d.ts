import {
  UseGlobalFiltersInstanceProps,
  UseGlobalFiltersOptions,
  UseGlobalFiltersState,
  UseSortByInstanceProps,
  UseSortByOptions,
  UseSortByColumnProps,
  UseSortByState,
} from 'react-table';

declare module 'react-table' {
  interface TableOptions<D extends object>
    extends UseSortByOptions<D>,
      UseGlobalFiltersOptions<D> {}

  interface TableInstance<D extends object = {}>
    extends UseGlobalFiltersInstanceProps<D>,
      UseSortByInstanceProps<D> {}
  interface TableState<D extends object = {}>
    extends UseGlobalFiltersState<D>,
      UseSortByState<D> {}

  interface ColumnInstance<D extends object = {}>
    extends UseSortByColumnProps<D> {}
}
