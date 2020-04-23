import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow as MuiTableRow,
  TableSortLabel,
  Chip,
  makeStyles,
} from '@material-ui/core';
import {
  Column,
  useGlobalFilter,
  useSortBy,
  useTable,
  UseGlobalFiltersInstanceProps,
  UseGlobalFiltersState,
  TableInstance,
  CellProps,
} from 'react-table';
import { formatRelative as format } from 'date-fns';
import { TableToolbar } from './TableToolbar';
import clsx from 'clsx';
import './SimpleTable.module.css';
import { TableRow } from '../types';

const useLastUpdatedStyles = makeStyles((theme) => ({
  root: {
    marginLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
}));

type Props = {
  columns: Column<TableRow>[];
  data: TableRow[];
  getCellProps: (cell: CellProps<any, TableRow>) => {};
  lastUpdated: Date;
};

export const SimpleTable = ({
  columns,
  data,
  getCellProps,
  lastUpdated,
}: Props) => {
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
    useSortBy,
    (hooks) => {
      hooks.allColumns.push((columns) => columns);
    }
  ) as UseGlobalFiltersInstanceProps<any> &
    TableInstance<any> & { state: UseGlobalFiltersState<any> };
  const date = lastUpdated;
  return (
    <TableContainer>
      <Chip
        label={`Last updated ${format(date, new Date())}`}
        className={clsx(useLastUpdatedStyles().root)}
      />
      <TableToolbar
        setGlobalFilter={setGlobalFilter}
        globalFilter={globalFilter}
      />
      <Table {...getTableProps()} size='small'>
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
              <TableCell />
              {headerGroup.headers.map((column: any) => (
                <TableCell
                  key={column.id}
                  {...column.getHeaderProps({
                    ...column.getSortByToggleProps(),
                    title: undefined,
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
          ))}
        </TableHead>
        <TableBody>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <MuiTableRow {...row.getRowProps()}>
                <TableCell>{i + 1}</TableCell>
                {row.cells.map((cell) => {
                  return (
                    <TableCell
                      {...cell.getCellProps()}
                      {...getCellProps(cell as any)}
                    >
                      {cell.render('Cell')}
                    </TableCell>
                  );
                })}
              </MuiTableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
