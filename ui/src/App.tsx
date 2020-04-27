import React from 'react';
import { TablePane } from './table/TablePane';
import { parseJSON } from 'date-fns';
import { LineChart } from './line-chart/LineChart';
import { InfoMenuBar } from './info-menubar/InfoMenuBar';
import {
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  CircularProgress,
  Switch,
} from '@material-ui/core';
import memoizeOne from 'memoize-one';
import { TableRow, DataSets, TimeSeries } from './types';
import { useImmer } from 'use-immer';

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

/*
function useAsyncMemo<T, R>(processor: () => R, deps: DependencyList): [R | undefined, (d: R | undefined) => void] {
  const [data, setData] = React.useState<R | undefined>(undefined);
  const callback = React.useCallback(processor, deps);
  React.useEffect(() => {
    const newData = callback();
    newData != data && setData(newData)
  }, [callback]);

  return [data, setData];
}

const usePromise = <T extends {}>(processor: () => Promise<T>, deps: any[]): [T | undefined, (d: T | undefined) => void] => {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const callback = React.useCallback(processor, deps);
  React.useEffect(() => {
    callback().then(newData => {
      newData != data && setData(newData);
    });
  }, [callback]);
  return [data, setData];
};*/
//test

const getUsIndex = (it: TableRow) => it.region === 'United States';
const getMdIndex = (it: TableRow) => it.region === 'Maryland';
const getNormalizedSeries = (row: TableRow) => row.changeNormalizedSeries;
const getSeries = (row: TableRow) => row.changeSeries;

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
        <LineChart
          data={series}
          leftAxisLabel='New Cases'
          height='22em'
          marginTop={0}
        />
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
