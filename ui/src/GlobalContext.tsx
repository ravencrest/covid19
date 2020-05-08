import React from 'react';
import { parseJSON } from 'date-fns';
import { Divider, CircularProgress } from '@material-ui/core';
import memoizeOne from 'memoize-one';
import { TableRow, DataSets, TimeSeries, Normalization } from './types';
import { useImmer } from 'use-immer';
import {
  Switch as SwitchRoute,
  Route,
  useLocation,
  useParams,
} from 'react-router-dom';
import qs from 'qs';
import App from './App';
import RegionView from './RegionView';

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

export const getUsResults = memoizeOne(async function (): Promise<
  FilteredResults
> {
  const results = await import('./results_us.json');
  const lastUpdated = parseJSON(results.lastUpdated);
  return { lastUpdated, rows: results.rows };
});

export const getUsCases = memoizeOne(async function (): Promise<
  Record<string, TimeSeries>
> {
  const result = await import('./results_us_cases.json');
  return (result as any) as Record<string, TimeSeries>;
});

export const getUsDeaths = memoizeOne(async function (): Promise<
  Record<string, TimeSeries>
> {
  const result = await import('./results_us_deaths.json');
  return (result as any) as Record<string, TimeSeries>;
});

export const getGlobalCases = memoizeOne(async function (): Promise<
  Record<string, TimeSeries>
> {
  const result = await import('./results_global_cases.json');
  return (result as any) as Record<string, TimeSeries>;
});

export const getGlobalDeaths = memoizeOne(async function (): Promise<
  Record<string, TimeSeries>
> {
  const result = await import('./results_global_deaths.json');
  return (result as any) as Record<string, TimeSeries>;
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

export const setLocation = (
  dataset: DataSets,
  normalized: Normalization,
  region?: string
) => {
  window.location.hash = `/${dataset}${
    region ? `/${region}` : ''
  }?norm=${normalized}`;
};

const Context = React.createContext({});

function GlobalContext() {
  const pathParams = useParams<{ dataset: string }>();
  const pathDataset = pathParams.dataset ?? 'global';
  const a = useLocation();
  const search = a.search;
  const params: { norm?: string } =
    search[0] === '?' ? qs.parse(search.slice(1)) : {};
  let norm: Normalization;
  switch (params.norm) {
    case 'gdp pop':
      norm = 'gdp+pop';
      break;
    case 'gdp':
      norm = 'gdp';
      break;
    case 'pop':
      norm = 'pop';
      break;
    default:
      norm = 'none';
  }
  const [state, updateState] = useImmer<{
    dataset: DataSets;
    rows?: TableRow[];
    normalized: Normalization;
    lastUpdated?: Date;
  }>({
    dataset: pathDataset === 'us' ? 'us' : 'global',
    rows: undefined,
    normalized: norm,
  });
  const { dataset, rows, normalized, lastUpdated } = state;

  useResults(
    dataset,
    React.useCallback(
      (results) => {
        updateState((draft) => {
          draft.lastUpdated = results?.lastUpdated;
          draft.rows = results?.rows;
        });
      },
      [updateState]
    )
  );

  const onDatasetChange = React.useCallback(
    (ds: DataSets, region?: string) => {
      setLocation(ds, normalized, region);
      updateState((draft) => {
        draft.dataset = ds;
      });
    },
    [updateState, normalized]
  );
  const onNormalizedChange = React.useCallback(
    (norm: Normalization, region?: string) => {
      setLocation(dataset, norm, region);
      updateState((draft) => {
        draft.normalized = norm;
      });
    },
    [updateState, dataset]
  );

  return (
    <Context.Provider value={{}}>
      <SwitchRoute>
        <Route path='/:dataset/:region'>
          <Divider />
          {rows && (
            <RegionView
              rows={rows}
              dataset={dataset}
              normalized={normalized}
              lastUpdated={lastUpdated}
              onNormalizedChange={onNormalizedChange}
            />
          )}
          {!rows && <CircularProgress />}
        </Route>
        <Route path='/'>
          <Divider />
          {rows && (
            <App
              rows={rows}
              dataset={dataset}
              normalized={normalized}
              lastUpdated={lastUpdated}
              onDatasetChange={onDatasetChange}
              onNormalizedChange={onNormalizedChange}
            />
          )}
          {!rows && <CircularProgress />}
        </Route>
      </SwitchRoute>
    </Context.Provider>
  );
}

export default React.memo(GlobalContext);
