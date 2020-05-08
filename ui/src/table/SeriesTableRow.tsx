import React from 'react';
import {
  createStyles,
  makeStyles,
  Theme,
  CircularProgress,
  Collapse,
  IconButton,
  TableRow as MuiTableRow,
  Paper,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { ExpandMore, Share } from '@material-ui/icons';
import clsx from 'clsx';
import { Cell, Row } from 'react-table';
import { DataSets, Normalization, Point, TableRow, TimeSeries } from '../types';
import { getDirectLink } from '../info-menubar/InfoMenuBar';
import { ShareDialog } from '../info-menubar/ShareDialog';
import stylesM from './Table.module.css';
import { Column } from './SimpleTable';
import { TableCell } from './TableCell';
import { getGlobalCases, getGlobalDeaths, getUsCases, getUsDeaths } from '../GlobalContext';

const LineChart = React.lazy(() => import('../line-chart/LineChart'));
const CalendarChart = React.lazy(() => import('../calendar-chart/CalendarChart'));

type Props = {
  row: Row<TableRow>;
  rowNumber: number;
  embedded?: boolean;
  dataset: DataSets;
  normalized: Normalization;
  columnIndex: ReadonlyMap<string, Column<TableRow>>;
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
      maxWidth: '15vw',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
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

const getCellClasses = (styles: ReturnType<typeof useCellStyles>, cell: Cell<TableRow>, row: Row<TableRow>) => {
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
        const className = value > 0 ? styles.negativeChange : styles.positiveChange;
        classes.push(className);
      }
      break;
  }
  return classes;
};

const SeriesPanelHeader = ({ children }: { children: React.ReactChild }) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <Typography component='h3'>{children}</Typography>
  </div>
);

export const SeriesPanel = ({
  normalized,
  dataset,
  region,
  row,
}: {
  normalized: Normalization;
  dataset: DataSets;
  region: string;
  row: TableRow;
}) => {
  const [ds, setDs] = React.useState<TimeSeries | undefined>();
  const [cs, setCs] = React.useState<TimeSeries | undefined>();
  const { population, gdp } = row;
  React.useEffect(() => {
    let csFunc;
    let dsFunc;

    if (dataset === 'global') {
      dsFunc = getGlobalDeaths;
      csFunc = getGlobalCases;
    } else {
      dsFunc = getUsDeaths;
      csFunc = getUsCases;
    }

    csFunc().then((data) => {
      let d = data[region];
      if (normalized === 'pop') {
        let points = d.points.map((point) => {
          return {
            ...point,
            value: Math.round((point.value / population) * 1000000),
          };
        });
        d = { ...d, points };
      } else if (normalized === 'gdp') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
            return { ...point, value: Math.round(point.value * gdp) };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      } else if (normalized === 'gdp+pop') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
            return {
              ...point,
              value: Math.round(((point.value * gdp) / population) * 1000000),
            };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      }
      setCs(d);
    });

    dsFunc().then((data) => {
      let d = data[region];
      if (normalized === 'pop') {
        let points = d.points.map((point) => {
          return {
            ...point,
            value: Math.round((point.value / population) * 1000000),
          };
        });
        d = { ...d, points };
      } else if (normalized === 'gdp') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
            return { ...point, value: Math.round(point.value * gdp) };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      } else if (normalized === 'gdp+pop') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
            return {
              ...point,
              value: Math.round(((point.value * gdp) / population) * 1000000),
            };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      }
      setDs(d);
    });
  }, [setDs, setCs, dataset, normalized, region, population, gdp]);

  const data = React.useMemo(() => {
    const d: Array<TimeSeries> = [];
    if (ds) {
      d.push(ds);
    }
    if (cs) {
      d.push(cs);
    }
    return d;
  }, [ds, cs]);
  return (
    <Paper>
      <SeriesPanelHeader>New deaths and cases</SeriesPanelHeader>
      <LineChart data={data} leftAxisLabel='change' marginTop={10} dataKey='label' />
      <SeriesPanelHeader>New cases</SeriesPanelHeader>
      {cs && <CalendarChart data={cs} />}
      <SeriesPanelHeader>New deaths</SeriesPanelHeader>
      {ds && <CalendarChart data={ds} />}
    </Paper>
  );
};

export const SeriesTableRow = ({ row, embedded, dataset, normalized, columnIndex, rowNumber }: Props) => {
  const series = row.original;
  const [expandedState, setExpandedState] = React.useState<ExpandState>(embedded ? 'OPEN' : 'CLOSED');
  const [showLinkDialog, setShowLinkDialog] = React.useState<boolean>(false);
  const expanded = expandedState === 'OPEN';
  const handleExpandClick = () => setExpandedState(expanded ? 'CLOSING' : 'OPEN');
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
      <MuiTableRow {...rowProps} style={{ maxWidth: '95vw' }}>
        {!embedded && (
          <>
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
            <TableCell className={clsx(classes.cell, stylesM.containerHidden)}>{rowNumber}</TableCell>
            <TableCell className={clsx(classes.cell, stylesM.containerHidden)} />
          </>
        )}
        {cells.map((cell) => {
          const column = columnIndex.get(cell.column.id);

          return (
            <TableCell
              className={clsx(classes.cell, ...getCellClasses(classes, cell, row), column?.className)}
              {...cell.getCellProps()}
            >
              {cell.render('Cell')}
            </TableCell>
          );
        })}
        {!embedded && (
          <TableCell id={`${row.original.region}`}>
            {series && (
              <>
                <Tooltip title='Share'>
                  <IconButton size='small' onClick={handleLinkClick} aria-label='Share'>
                    <Share />
                  </IconButton>
                </Tooltip>
                <ShareDialog
                  onClose={closeLinkDialog}
                  open={showLinkDialog}
                  href={getDirectLink(dataset, normalized, row.original.code)}
                />
              </>
            )}
          </TableCell>
        )}
      </MuiTableRow>
      {expandedState !== 'CLOSED' && (
        <MuiTableRow {...rowProps} key={`${rowProps.key}_expand`} style={{ maxWidth: '95vw', overflow: 'hidden' }}>
          <TableCell colSpan={cells.length + (embedded ? 0 : 4)} className={stylesM.container}>
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
                <SeriesPanel
                  normalized={normalized}
                  dataset={dataset}
                  region={row.original.region}
                  row={row.original}
                />
              </React.Suspense>
            </Collapse>
          </TableCell>
        </MuiTableRow>
      )}
    </>
  );
};
