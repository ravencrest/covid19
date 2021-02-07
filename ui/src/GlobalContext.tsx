import { createContext, useEffect, useCallback, memo } from 'react';
import { CircularProgress, Divider } from '@material-ui/core';
import { DataSets, Normalization, Results, TableRow } from './types';
import { useImmer } from 'use-immer';
import { Route, Switch as SwitchRoute, useLocation, useParams } from 'react-router-dom';
import qs from 'qs';
import DatasetView from './dataset/DatasetView';
import RegionView from './region/RegionView';
import { getGlobalTableRows, getUsTableRows } from './data-mappers';

const useResults = (dataset: DataSets, handler: (r: Results | undefined) => void) => {
  const global = dataset === 'global';
  useEffect(() => {
    const promise = global ? getGlobalTableRows : getUsTableRows;
    promise().then(handler);
  }, [global, handler]);
};

export const setLocation = (dataset: DataSets, normalized: Normalization[], region?: string) => {
  window.location.hash = `/${dataset}${region ? `/${region}` : ''}?norm=${normalized.join('+')}`;
};

const Context = createContext({});

function GlobalContext() {
  const pathParams = useParams<{ dataset: string }>();
  const pathDataset = pathParams.dataset ?? 'global';
  const a = useLocation();
  const search = a.search;
  const params: { norm?: string } = search[0] === '?' ? qs.parse(search.slice(1)) : {};
  const norm = params.norm
    ?.split(' ')
    .filter((f) => f === 'gdp' || f === 'pop' || f === 'tests' || f === 'none') as Normalization[];
  const [state, updateState] = useImmer<{
    dataset: DataSets;
    rows?: TableRow[];
    normalized: Normalization[];
    lastUpdated?: Date;
  }>({
    dataset: pathDataset === 'us' ? 'us' : 'global',
    rows: undefined,
    normalized: norm || [],
  });
  const { dataset, rows, normalized, lastUpdated } = state;

  useResults(
    dataset,
    useCallback(
      (results) => {
        updateState((draft) => {
          draft.lastUpdated = results?.lastUpdated;
          draft.rows = results?.rows;
        });
      },
      [updateState]
    )
  );

  const onDatasetChange = useCallback(
    (ds: DataSets, region?: string) => {
      setLocation(ds, normalized, region);
      updateState((draft) => {
        draft.dataset = ds;
      });
    },
    [updateState, normalized]
  );
  const onNormalizedChange = useCallback(
    (norm: Normalization[], region?: string) => {
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
            <DatasetView
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

export default memo(GlobalContext);
