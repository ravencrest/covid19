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
import { CellProps, Row } from 'react-table';
import { TableRow } from '../types';
import { LineChart } from '../line-chart/LineChart';
const CalendarChart = React.lazy(() =>
  import('../calendar-chart/CalendarChart')
);

type Props = {
  row: TableRow;
  rtRow: Row<any>;
  i: number;
  getCellProps: (cell: CellProps<any, TableRow>) => {};
};

type ExpandState = 'OPEN' | 'CLOSED' | 'CLOSING';

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
    cell: {
      padding: '6px 6px 6px 16px',
    },
  })
);

export const ExpandableTableRow = React.memo(
  ({ row: data, rtRow: row, i, getCellProps }: Props) => {
    const [expandedState, setExpandedState] = React.useState<ExpandState>(
      'CLOSED'
    );
    const expanded = expandedState === 'OPEN';
    const handleExpandClick = () =>
      setExpandedState(expanded ? 'CLOSING' : 'OPEN');
    const classes = useStyles();
    const changeNormalizedSeries = data.changeNormalizedSeries;
    const rowProps = row.getRowProps();
    return (
      <>
        <MuiTableRow {...rowProps}>
          <TableCell className={classes.cell}>
            {changeNormalizedSeries && (
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
          <TableCell className={classes.cell}>{i + 1}</TableCell>
          {row.cells.map((cell) => {
            return (
              <TableCell
                className={classes.cell}
                {...cell.getCellProps()}
                {...getCellProps(cell as any)}
              >
                {cell.render('Cell')}
              </TableCell>
            );
          })}
        </MuiTableRow>
        {changeNormalizedSeries && expandedState !== 'CLOSED' && (
          <MuiTableRow {...rowProps} key={`${rowProps.key}_expand`}>
            <TableCell colSpan={row.cells.length + 2}>
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
                      New cases (normalized per 1mil)
                    </div>
                    <CalendarChart data={changeNormalizedSeries} />
                    <LineChart
                      data={changeNormalizedSeries}
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
  }
);
