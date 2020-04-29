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
  Tooltip,
} from '@material-ui/core';
import { ExpandMore, Share } from '@material-ui/icons';
import clsx from 'clsx';
import { Cell, Row } from 'react-table';
import { DataSets, TableRow, TimeSeries } from '../types';
import { getDirectLink, ShareDialog } from '../info-menubar/InfoMenuBar';
const LineChart = React.lazy(() => import('../line-chart/LineChart'));
const CalendarChart = React.lazy(() =>
  import('../calendar-chart/CalendarChart')
);

type Props = {
  row: Row<TableRow>;
  rowNumber: number;
  series: TimeSeries | undefined;
  embedded?: boolean;
  dataset: DataSets;
  normalized: boolean;
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

export const SeriesPanel = ({ series }: { series: TimeSeries }) => {
  return (
    <Paper>
      <div style={{ display: 'flex', justifyContent: 'center' }}>New cases</div>
      <CalendarChart data={series} />
      <LineChart
        data={series}
        leftAxisLabel='change'
        hideLegend
        marginTop={0}
        marginRight={40}
      />
    </Paper>
  );
};

export const SeriesTableRow = ({
  row,
  rowNumber,
  series,
  embedded,
  dataset,
  normalized,
}: Props) => {
  const [expandedState, setExpandedState] = React.useState<ExpandState>(
    embedded ? 'OPEN' : 'CLOSED'
  );
  const [showLinkDialog, setShowLinkDialog] = React.useState<boolean>(false);
  const expanded = expandedState === 'OPEN';
  const handleExpandClick = () =>
    setExpandedState(expanded ? 'CLOSING' : 'OPEN');
  const classes = useCellStyles();
  const rowProps = row.getRowProps();
  const cells = row.cells;
  const handleLinkClick = () => {
    setShowLinkDialog(true);
  };

  const closeLinkDialog = () => {
    setShowLinkDialog(false);
  };

  return (
    <>
      <MuiTableRow {...rowProps}>
        {!embedded && (
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
        )}
        {!embedded && (
          <TableCell className={classes.cell}>{rowNumber + 1}</TableCell>
        )}
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
        {!embedded && (
          <TableCell className={classes.cell} id={`${row.original.region}`}>
            {series && (
              <>
                <IconButton
                  size='small'
                  onClick={handleLinkClick}
                  aria-label='Share'
                >
                  <Share />
                </IconButton>
                <Tooltip title='Share'>
                  <ShareDialog
                    onClose={closeLinkDialog}
                    open={showLinkDialog}
                    href={getDirectLink(
                      dataset,
                      normalized,
                      row.original.region
                    )}
                  />
                </Tooltip>
              </>
            )}
          </TableCell>
        )}
      </MuiTableRow>
      {series && expandedState !== 'CLOSED' && (
        <MuiTableRow {...rowProps} key={`${rowProps.key}_expand`}>
          <TableCell colSpan={cells.length + (embedded ? 0 : 3)}>
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
                <SeriesPanel series={series} />
              </React.Suspense>
            </Collapse>
          </TableCell>
        </MuiTableRow>
      )}
    </>
  );
};
