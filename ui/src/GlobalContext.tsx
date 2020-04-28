import React from 'react';
import { parseJSON } from 'date-fns';
import { Divider, CircularProgress } from '@material-ui/core';
import memoizeOne from 'memoize-one';
import { TableRow, DataSets } from './types';
import { useImmer } from 'use-immer';
import { Switch as SwitchRoute, Route, useLocation } from 'react-router-dom';
import qs from 'qs';
import App from './App';

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

const Context = React.createContext({});

function GlobalContext() {
  const a = useLocation();
  const search = a.search;
  const params: { norm?: string; ds?: string; region?: string } =
    search[0] == '?' ? qs.parse(search.slice(1)) : {};
  const [state, updateState] = useImmer<{
    dataset: DataSets;
    rows?: TableRow[];
    normalized: boolean;
    lastUpdated?: Date;
    region?: string;
  }>({
    dataset: params.ds == 'us' ? 'us' : 'global',
    rows: undefined,
    normalized: params.norm != 'false',
    region: params.region,
  });
  const { dataset, rows, normalized, lastUpdated, region } = state;

  useResults(
    dataset,
    React.useCallback(
      (results) => {
        updateState((draft) => {
          draft.lastUpdated = results?.lastUpdated;
          //draft.rows = region ? r?.rows.filter(rr => rr.region == region) : r?.rows;
          draft.rows = results?.rows;
        });
      },
      [updateState]
    )
  );

  const onDatasetChange = React.useCallback(
    (ds) => {
      updateState((draft) => {
        draft.dataset = ds;
      });
    },
    [updateState]
  );
  const onNormalizedChange = React.useCallback(
    (norm) => {
      updateState((draft) => {
        draft.normalized = norm;
      });
    },
    [updateState]
  );

  return (
    <Context.Provider value={{}}>
      <Route>
        <SwitchRoute>
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
      </Route>
    </Context.Provider>
  );
}

export default React.memo(GlobalContext);
