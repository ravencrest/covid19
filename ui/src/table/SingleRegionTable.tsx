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
    <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map((column) => (
        <TableCell className={styles.cell} key={column.id}>
          {' '}
          <div style={{ display: 'inline-flex' }}>
            {column.render('Header')}
          </div>
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
    <TableContainer style={{ overflowX: 'unset' }}>
      <Table {...getTableProps()} size='small'>
        <TableHead>{headers}</TableHead>
        <TableBody>{rowCells}</TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(SingleRegionTable);
