import { parseJSON } from 'date-fns';
import memoizeOne from 'memoize-one';
import { DataSets, RawResults, Results, TimeSeries } from './types';

const getTableRows = async function (file: Promise<RawResults>): Promise<Results> {
  const results = await file;
  const lastUpdated = parseJSON(results.lastUpdated);
  return { lastUpdated, rows: results.rows };
};

export const getTimeSeries = async function (file: Promise<unknown>): Promise<Record<string, TimeSeries>> {
  const result = (await file) as Record<string, TimeSeries>;
  return (result as any) as Record<string, TimeSeries>;
};

export const getGlobalTableRows = memoizeOne(() => getTableRows(import('./results_global.json')));
export const getUsTableRows = memoizeOne(() => getTableRows(import('./results_us.json')));
export const getUsCases = memoizeOne(() => getTimeSeries(import('./results_us_cases.json')));
export const getUsDeaths = memoizeOne(() => getTimeSeries(import('./results_us_deaths.json')));
export const getGlobalCases = memoizeOne(() => getTimeSeries(import('./results_global_cases.json')));
export const getGlobalDeaths = memoizeOne(() => getTimeSeries(import('./results_global_deaths.json')));
export const getUsTests = memoizeOne(() => getTimeSeries(import('./results_us_tests.json')));

export const getCasesTimeSeries = (dataset: DataSets) => {
  let csFunc;

  if (dataset === 'global') {
    csFunc = getGlobalCases;
  } else {
    csFunc = getUsCases;
  }
  return csFunc;
};

export const getDeathsTimeSeries = (dataset: DataSets) => {
  let dsFunc;

  if (dataset === 'global') {
    dsFunc = getGlobalDeaths;
  } else {
    dsFunc = getUsDeaths;
  }
  return dsFunc;
};
