import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow as MuiTableRow,
  TableSortLabel,
} from '@material-ui/core';
import { Column, useGlobalFilter, useSortBy, useTable, Row } from 'react-table';
import { TableRow } from '../types';
import { TableToolbar } from './TableToolbar';
import { useCellStyles } from './SeriesTableRow';

type Props = {
  columns: Column<TableRow>[];
  data: TableRow[];
  rowBuilder: (row: Row<TableRow>, i: number) => React.ReactNode;
};

export const SimpleTable = React.memo(
  ({ columns, data, rowBuilder }: Props) => {
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
    const styles = useCellStyles();

    const headers = React.useMemo(
      () =>
        headerGroups.map((headerGroup) => (
          <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
            <TableCell className={styles.cell} />
            <TableCell className={styles.cell} />
            {headerGroup.headers.map((column) => (
              <TableCell
                className={styles.cell}
                key={column.id}
                {...column.getHeaderProps({
                  ...column.getSortByToggleProps(),
                })}
              >
                <div style={{ display: 'inline-flex' }}>
                  {column.render('Header')}
                  <TableSortLabel
                    active={column.isSorted}
                    // react-table has a unsorted state which is not treated here
                    direction={column.isSortedDesc ? 'desc' : 'asc'}
                  />
                </div>
              </TableCell>
            ))}
          </MuiTableRow>
        )),
      [headerGroups, styles.cell]
    );

    const rowCells = React.useMemo(
      () =>
        rows.map((row, i) => {
          prepareRow(row);
          return rowBuilder(row, i);
        }),
      [rowBuilder, prepareRow, rows]
    );

    return (
      <TableContainer>
        <TableToolbar
          setGlobalFilter={setGlobalFilter}
          globalFilter={globalFilter}
        />
        <Table {...getTableProps()} size='small'>
          <TableHead>{headers}</TableHead>
          <TableBody>{rowCells}</TableBody>
        </Table>
      </TableContainer>
    );
  }
);
