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
import stylesM from './Table.module.css';
import clsx from 'clsx';

type Props = {
  columns: Column<TableRow>[];
  data: TableRow[];
  rowBuilder: (row: Row<TableRow>, i: number) => React.ReactNode;
};

export const shouldHideColumn = (id: string) => {
  return (
    id === 'change' || id === 'recovered' || id == 'population' || id == 'row#'
  );
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

    const headers = headerGroups.map((headerGroup) => (
      <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
        <TableCell
          className={clsx(
            styles.cell,
            shouldHideColumn('row#') ? stylesM.containerHidden : undefined
          )}
        />
        <TableCell className={styles.cell} />
        {headerGroup.headers.map((column) => (
          <TableCell
            className={clsx(
              styles.cell,
              shouldHideColumn(column.id) ? stylesM.containerHidden : undefined
            )}
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
        <TableCell className={styles.cell} />
      </MuiTableRow>
    ));

    const rowCells = React.useMemo(
      () =>
        rows.map((row, i) => {
          prepareRow(row);
          return rowBuilder(row, i);
        }),
      [rowBuilder, prepareRow, rows]
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
