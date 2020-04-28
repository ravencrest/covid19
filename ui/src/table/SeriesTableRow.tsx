import React from 'react';
import {
  createStyles,
  makeStyles,
  Theme,
  CircularProgress,
  Collapse,
  IconButton,
  TableCell,
  TableRow as MuiTableRow,
  Paper,
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import clsx from 'clsx';
import { Cell, Row } from 'react-table';
import { TableRow, TimeSeries } from '../types';
const LineChart = React.lazy(() => import('../line-chart/LineChart'));
const CalendarChart = React.lazy(() =>
  import('../calendar-chart/CalendarChart')
);

type Props = {
  row: Row<TableRow>;
  rowNumber: number;
  series: TimeSeries | undefined;
  defaultExpanded?: boolean;
};

type ExpandState = 'OPEN' | 'CLOSED' | 'CLOSING';

export const useCellStyles = makeStyles((theme: Theme) =>
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
    cell: {
      padding: '6px 6px 6px 0px !important',
    },
    bold: {
      fontWeight: 'bold',
    },
    positiveChange: {
      color: 'green',
    },
    negativeChange: {
      color: 'red',
    },
  })
);

const getCellClasses = (
  styles: ReturnType<typeof useCellStyles>,
  cell: Cell<TableRow>,
  row: Row<TableRow>
) => {
  const region = row.original.region;
  const id = cell.column.id;
  const value: unknown = cell.value;

  let classes: string[] = [];
  if (region === 'United States' || region === 'Maryland') {
    classes = [styles.bold];
  }
  switch (id) {
    case 'change':
    case 'weeklyChange':
      if (typeof value == 'number' && value !== 0) {
        const className =
          value > 0 ? styles.negativeChange : styles.positiveChange;
        classes.push(className);
      }
      break;
  }
  return classes;
};

export const SeriesTableRow = ({ row, rowNumber, series }: Props) => {
  const [expandedState, setExpandedState] = React.useState<ExpandState>(
    'CLOSED'
  );
  const expanded = expandedState === 'OPEN';
  const handleExpandClick = () =>
    setExpandedState(expanded ? 'CLOSING' : 'OPEN');
  const classes = useCellStyles();
  const rowProps = row.getRowProps();
  const cells = row.cells;
  return (
    <>
      <MuiTableRow {...rowProps}>
        <TableCell className={classes.cell} id={`${row.original.region}`}>
          {series && (
            <IconButton
              size='small'
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
        <TableCell className={classes.cell}>{rowNumber + 1}</TableCell>
        {cells.map((cell) => {
          return (
            <TableCell
              className={clsx(
                classes.cell,
                ...getCellClasses(classes, cell, row)
              )}
              {...cell.getCellProps()}
            >
              {cell.render('Cell')}
            </TableCell>
          );
        })}
      </MuiTableRow>
      {series && expandedState !== 'CLOSED' && (
        <MuiTableRow {...rowProps} key={`${rowProps.key}_expand`}>
          <TableCell colSpan={cells.length + 2}>
            <Collapse
              in={expanded}
              timeout='auto'
              unmountOnExit
              onExited={() => {
                setExpandedState('CLOSED');
              }}
              style={{ width: '100%' }}
            >
              <React.Suspense fallback={<CircularProgress />}>
                <Paper>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    New cases
                  </div>
                  <CalendarChart data={series} />
                  <LineChart
                    data={series}
                    leftAxisLabel='change'
                    hideLegend
                    marginTop={0}
                    marginRight={40}
                  />
                </Paper>
              </React.Suspense>
            </Collapse>
          </TableCell>
        </MuiTableRow>
      )}
    </>
  );
};
