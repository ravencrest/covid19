import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow as MuiTableRow,
} from '@material-ui/core';
import { Column, useTable, Row } from 'react-table';
import { TableRow } from '../types';
import { useCellStyles } from './SeriesTableRow';
import stylesM from './Table.module.css';
import clsx from 'clsx';
import { shouldHideColumn } from './SimpleTable';

type Props = {
  columns: Column<TableRow>[];
  data: TableRow[];
  rowBuilder: (row: Row<TableRow>, i: number) => React.ReactNode;
};

function SingleRegionTable({ columns, data, rowBuilder }: Props) {
  const { getTableProps, headerGroups, prepareRow, rows } = useTable({
    columns,
    data,
  });
  const styles = useCellStyles();

  const headers = headerGroups.map((headerGroup) => (
    <MuiTableRow
      {...headerGroup.getHeaderGroupProps()}
      style={{ maxWidth: '90vw', overflow: 'hidden' }}
    >
      {headerGroup.headers.map((column) => (
        <TableCell
          className={clsx(
            styles.cell,
            shouldHideColumn(column.id) ? stylesM.containerHidden : undefined
          )}
          key={column.id}
        >
          {' '}
          {column.render('Header')}
        </TableCell>
      ))}
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
    <TableContainer style={{ overflowX: 'hidden' }}>
      <Table {...getTableProps()} size='small'>
        <TableHead>{headers}</TableHead>
        <TableBody>{rowCells}</TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(SingleRegionTable);
