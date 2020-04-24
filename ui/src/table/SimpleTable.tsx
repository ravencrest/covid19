import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow as MuiTableRow,
  TableSortLabel,
  Collapse,
  makeStyles,
  Theme,
  createStyles,
  IconButton,
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
  Row,
} from 'react-table';
import { TableToolbar } from './TableToolbar';
import './SimpleTable.module.css';
import { TableRow } from '../types';
import { ExpandMore } from '@material-ui/icons';
import clsx from 'clsx';
import { CalendarChart } from '../calendar-chart/CalendarChart';

type Props = {
  columns: Column<TableRow>[];
  data: TableRow[];
  getCellProps: (cell: CellProps<any, TableRow>) => {};
};

type TableRowProps = {
  row: TableRow;
  rtRow: Row<any>;
  i: number;
  getCellProps: (cell: CellProps<any, TableRow>) => {};
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: 345,
    },
    media: {
      height: 0,
      paddingTop: '56.25%', // 16:9
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
  })
);
export const ExpandableTableRow = ({
  row: data,
  rtRow: row,
  i,
  getCellProps,
}: TableRowProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => setExpanded(!expanded);
  const classes = useStyles();
  const changeNormalizedSeries = data.changeNormalizedSeries;
  const rowProps = row.getRowProps();
  return (
    <>
      <MuiTableRow {...rowProps}>
        <TableCell>
          {changeNormalizedSeries && (
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: expanded,
              })}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label='show more'
            >
              <ExpandMore />
            </IconButton>
          )}
        </TableCell>
        <TableCell>{i + 1}</TableCell>

        {row.cells.map((cell) => {
          return (
            <TableCell {...cell.getCellProps()} {...getCellProps(cell as any)}>
              {cell.render('Cell')}
            </TableCell>
          );
        })}
      </MuiTableRow>
      {changeNormalizedSeries && (
        <MuiTableRow {...rowProps} key={`${rowProps.key}_expand`}>
          <TableCell
            colSpan={row.cells.length + 2}
            style={{ display: expanded ? undefined : 'none' }}
          >
            <Collapse
              in={expanded}
              timeout='auto'
              unmountOnExit
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                New cases (normalized per 100k)
              </div>
              <CalendarChart data={changeNormalizedSeries} />
            </Collapse>
          </TableCell>
        </MuiTableRow>
      )}
    </>
  );
};

export const SimpleTable = ({ columns, data, getCellProps }: Props) => {
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
              <ExpandableTableRow
                key={i}
                row={row.original}
                rtRow={row}
                i={i}
                getCellProps={getCellProps}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
