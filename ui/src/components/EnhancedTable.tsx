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
import { parseJSON, formatRelative as format } from 'date-fns';
import { TableToolbar } from './TableToolbar';
import clsx from 'clsx';

const useLastUpdatedStyles = makeStyles((theme) => ({
  root: {
    marginLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
}));

export type Results = { lastUpdated: string; rows: Array<TableRow> };

export type TableRow = {
  rank: number;
  region: string;
  cases: number;
  casesNormalized: number;
  deaths: number;
  deathsNormalized: number;
  population: number;
};

type Props = {
  columns: Column<TableRow>[];
  data: Results;
  getCellProps: (cell: CellProps<any, TableRow>) => {};
};

export const EnhancedTable = ({ columns, data, getCellProps }: Props) => {
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
      data: data.rows,
    },
    useGlobalFilter,
    useSortBy,
    (hooks) => {
      hooks.allColumns.push((columns) => [...columns]);
    }
  ) as UseGlobalFiltersInstanceProps<any> &
    TableInstance<any> & { state: UseGlobalFiltersState<any> };
  const date = parseJSON(data.lastUpdated);
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
      <Table {...getTableProps()}>
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
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
                    {column.id !== 'selection' ? (
                      <TableSortLabel
                        active={column.isSorted}
                        // react-table has a unsorted state which is not treated here
                        direction={column.isSortedDesc ? 'desc' : 'asc'}
                      />
                    ) : null}
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
                {row.cells.map((cell) => (
                  <TableCell
                    {...cell.getCellProps()}
                    {...getCellProps(cell as any)}
                  >
                    {cell.render('Cell')}
                  </TableCell>
                ))}
              </MuiTableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
