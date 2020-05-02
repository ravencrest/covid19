import React, { ReactElement, ReactFragment, ReactText } from 'react';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow as MuiTableRow,
  TableSortLabel,
} from '@material-ui/core';
import {
  CellProps,
  Column as RtColumn,
  Row,
  useGlobalFilter,
  useSortBy,
  useTable,
  UseTableRowProps,
} from 'react-table';
import { TableRow } from '../types';
import { TableToolbar } from './TableToolbar';
import { TableCell } from './TableCell';

type ValueOf<T> = T[keyof T];

type ColumnInterfaceBasedOnValue<T, V> = {
  cell?: (props: {
    value: V;
    row: T;
  }) => ReactElement | ReactText | ReactFragment;
};

export type Column<T> = {
  id: string;
  header?: React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
  className?: string;
  width?: number;
} & ValueOf<
  {
    [K in keyof T]: {
      accessor: K;
    } & ColumnInterfaceBasedOnValue<T, T[K]>;
  }
>;

type Props = {
  columns: Column<TableRow>[];
  data: TableRow[];
  rowBuilder: (
    row: Row<TableRow>,
    columnIndex: ReadonlyMap<string, Column<TableRow>>,
    i: number
  ) => React.ReactNode;
  embedded?: boolean;
};

export const SimpleTable = React.memo(
  ({ columns: rawColumns, data, rowBuilder, embedded }: Props) => {
    const rawColumnIndex = React.useMemo(() => {
      const index = new Map<string, Column<TableRow>>();
      for (let column of rawColumns) {
        index.set(column.id, column);
      }
      return index as ReadonlyMap<string, Column<TableRow>>;
    }, [rawColumns]);
    const columns = React.useMemo(
      () =>
        rawColumns.map((col) => {
          const { id, header, cell: cellRender, accessor } = col;
          const c: RtColumn<TableRow> = {
            id,
            accessor,
          };
          header && (c.Header = header);
          cellRender &&
            ((c as any).Cell = ({
              row,
              cell,
            }: {
              row: UseTableRowProps<TableRow>;
              cell: CellProps<TableRow>;
            }) => {
              return cellRender({
                value: cell.value as any,
                row: row.original,
              });
            });
          return c;
        }),
      [rawColumns]
    );
    const {
      getTableProps,
      headerGroups,
      prepareRow,
      setGlobalFilter,
      state: { globalFilter },
      rows,
    } = useTable(
      {
        columns,
        data,
      },
      useGlobalFilter,
      useSortBy
    );

    const headers = headerGroups.map((headerGroup) => (
      <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
        {!embedded && (
          <>
            <TableCell />
            <TableCell responsive />
            <TableCell responsive />
          </>
        )}
        {headerGroup.headers.map((column) => (
          <TableCell
            className={rawColumnIndex.get(column.id)?.className}
            key={column.id}
            {...column.getHeaderProps({
              ...column.getSortByToggleProps(),
            })}
          >
            {' '}
            {column.isSortedDesc}
            <div style={{ display: 'inline-flex' }}>
              {column.render('Header')}

              <TableSortLabel
                active={!!column.isSorted}
                // react-table has a unsorted state which is not treated here
                direction={column.isSortedDesc ? 'desc' : 'asc'}
              />
            </div>
          </TableCell>
        ))}
        <TableCell />
      </MuiTableRow>
    ));

    const rowCells = React.useMemo(
      () =>
        rows.map((row, i) => {
          prepareRow(row);
          return rowBuilder(row, rawColumnIndex, i);
        }),
      [rowBuilder, prepareRow, rows, rawColumnIndex]
    );

    return (
      <TableContainer style={{ overflowX: 'unset' }}>
        {rows.length > 1 && (
          <TableToolbar
            setGlobalFilter={setGlobalFilter}
            globalFilter={globalFilter}
          />
        )}
        <Table {...getTableProps()} size='small'>
          <TableHead>{headers}</TableHead>
          <TableBody>{rowCells}</TableBody>
        </Table>
      </TableContainer>
    );
  }
);
