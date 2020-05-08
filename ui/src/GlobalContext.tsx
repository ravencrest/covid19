import React from 'react';
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
  React.useEffect(() => {
    const promise = global ? getGlobalTableRows : getUsTableRows;
    promise().then(handler);
  }, [global, handler]);
};

export const setLocation = (dataset: DataSets, normalized: Normalization, region?: string) => {
  window.location.hash = `/${dataset}${region ? `/${region}` : ''}?norm=${normalized}`;
};

const Context = React.createContext({});

function GlobalContext() {
  const pathParams = useParams<{ dataset: string }>();
  const pathDataset = pathParams.dataset ?? 'global';
  const a = useLocation();
  const search = a.search;
  const params: { norm?: string } = search[0] === '?' ? qs.parse(search.slice(1)) : {};
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

export default React.memo(GlobalContext);
