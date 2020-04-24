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
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import clsx from 'clsx';

import { CellProps, Row } from 'react-table';
import './SimpleTable.module.css';
import { TableRow } from '../types';

const CalendarChart = React.lazy(() =>
  import('../calendar-chart/CalendarChart')
);

type Props = {
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

export const ExpandableTableRow = React.memo(
  ({ row: data, rtRow: row, i, getCellProps }: Props) => {
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
              <TableCell
                {...cell.getCellProps()}
                {...getCellProps(cell as any)}
              >
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
                <React.Suspense fallback={<CircularProgress />}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    New cases (normalized per 100k)
                  </div>
                  <CalendarChart data={changeNormalizedSeries} />
                </React.Suspense>
              </Collapse>
            </TableCell>
          </MuiTableRow>
        )}
      </>
    );
  }
);
