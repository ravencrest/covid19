import React from 'react';
import { parseJSON } from 'date-fns';
import {
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  CircularProgress,
  Switch,
  Typography,
  ExpansionPanel,
  ExpansionPanelSummary,
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import memoizeOne from 'memoize-one';
import { TableRow, DataSets, TimeSeries } from './types';
import { useImmer } from 'use-immer';

const LineChart = React.lazy(() => import('./line-chart/LineChart'));
const InfoMenuBar = React.lazy(() => import('./info-menubar/InfoMenuBar'));
const TablePane = React.lazy(() => import('./table/TablePane'));
const ChoroplethChart = React.lazy(() =>
  import('./choropleth-chart/ChoroplethChart')
);

type FilteredResults = {
  lastUpdated: Date;
  rows: TableRow[];
};

const getGlobalResults = memoizeOne(async function (): Promise<
  FilteredResults
> {
  const results = await import('./results_global.json');
  const lastUpdated = parseJSON(results.lastUpdated);
  return { lastUpdated, rows: results.rows };
});

const getUsResults = memoizeOne(async function (): Promise<FilteredResults> {
  const results = await import('./results_us.json');
  const lastUpdated = parseJSON(results.lastUpdated);
  return { lastUpdated, rows: results.rows };
});

const useResults = (
  dataset: DataSets,
  handler: (r: FilteredResults | undefined) => void
) => {
  const global = dataset === 'global';
  React.useEffect(() => {
    const promise = global ? getGlobalResults : getUsResults;
    promise().then(handler);
  }, [global, handler]);
};

const getUsIndex = (it: TableRow) => it.region === 'United States';
const getMdIndex = (it: TableRow) => it.region === 'Maryland';
const getNormalizedSeries = (row: TableRow) => row.changeNormalizedSeries;
const getSeries = (row: TableRow) => row.changeSeries;

const rowToNormalizedCases = (row: TableRow) => row.casesNormalized;
const rowToCases = (row: TableRow) => row.cases;

const App = React.memo(() => {
  const [state, updateState] = useImmer<{
    dataset: DataSets;
    series?: TimeSeries[];
    rows?: TableRow[];
    normalized: boolean;
    lastUpdated?: Date;
  }>({
    dataset: 'global',
    series: undefined,
    rows: undefined,
    normalized: true,
  });
  const { dataset, series, rows, normalized, lastUpdated } = state;
  useResults(
    dataset,
    React.useCallback(
      (r) => {
        updateState((draft) => {
          draft.lastUpdated = r?.lastUpdated;
          draft.rows = r?.rows;
        });
      },
      [updateState]
    )
  );
  let min = 80;
  let max = 500;

  if (!normalized) {
    min = 2000;
    max = 200000;
  }

  React.useEffect(() => {
    const global = dataset === 'global';

    const populationLimit = global ? 1000000 : 6073116;
    const indexToSlice = global ? getUsIndex : getMdIndex;
    const changeMapper = normalized ? getNormalizedSeries : getSeries;
    const indexOfMd = rows?.findIndex(indexToSlice) ?? 0;

    const r = rows
      ?.filter((row) => row.population > populationLimit)
      .map(changeMapper)
      .filter((s) => s != null)
      .slice(0, Math.min(indexOfMd + 1, rows?.length - 1)) as TimeSeries[];
    updateState((draft) => {
      draft.series = r;
    });
  }, [rows, normalized, dataset, updateState]);
  const worldAccessor = normalized ? rowToNormalizedCases : rowToCases;
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar lastUpdated={lastUpdated}>
          <FormControlLabel
            control={
              <Switch
                checked={normalized}
                onChange={(event, value) => {
                  event.stopPropagation();
                  updateState((draft) => {
                    draft.normalized = value;
                  });
                }}
                name='normalized'
              />
            }
            label='Normalized'
          />
          <RadioGroup
            row
            value={dataset}
            onChange={(event, value) => {
              event.stopPropagation();
              updateState((draft) => {
                draft.dataset = value as DataSets;
                draft.series = undefined;
              });
            }}
          >
            <FormControlLabel value='us' control={<Radio />} label='US' />
            <FormControlLabel
              value='global'
              control={<Radio />}
              label='Global'
            />
          </RadioGroup>
        </InfoMenuBar>
        <React.Suspense fallback={<CircularProgress />}>
          {dataset === 'global' && rows && (
            <ExpansionPanel defaultExpanded>
              <ExpansionPanelSummary expandIcon={<ExpandMore />}>
                <Typography variant='h6' display='block' gutterBottom>
                  Total Cases
                </Typography>
              </ExpansionPanelSummary>
              <ChoroplethChart
                data={rows}
                accessor={worldAccessor}
                min={min}
                max={max}
              />
            </ExpansionPanel>
          )}
          <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMore />}>
              <Typography variant='h6' display='block' gutterBottom>
                New Cases Over Time
              </Typography>
            </ExpansionPanelSummary>
            <LineChart
              data={series}
              leftAxisLabel='New Cases'
              height='22em'
              marginTop={0}
              marginRight={200}
            />
          </ExpansionPanel>
        </React.Suspense>
        <Divider />
        {rows && (
          <TablePane data={rows} datasetKey={dataset} normalized={normalized} />
        )}
        {!rows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
});

export default App;
