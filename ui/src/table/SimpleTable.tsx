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
import {
  Column,
  TableInstance,
  useGlobalFilter,
  UseGlobalFiltersInstanceProps,
  UseGlobalFiltersState,
  useSortBy,
  useTable,
  Row,
} from 'react-table';
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
      useSortBy,
      (hooks) => {
        hooks.allColumns.push((columns) => columns);
      }
    ) as UseGlobalFiltersInstanceProps<any> &
      TableInstance<any> & { state: UseGlobalFiltersState<any> };
    const styles = useCellStyles();
    return (
      <TableContainer>
        <TableToolbar
          setGlobalFilter={setGlobalFilter}
          globalFilter={globalFilter}
        />
        <Table {...getTableProps()} size='small'>
          <TableHead>
            {headerGroups.map((headerGroup) => (
              <MuiTableRow {...headerGroup.getHeaderGroupProps()}>
                <TableCell className={styles.cell} />
                <TableCell className={styles.cell} />
                {headerGroup.headers.map((column: any) => (
                  <TableCell
                    className={styles.cell}
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
              return rowBuilder(row, i);
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);
