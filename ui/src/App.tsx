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
} from '@material-ui/core';
import memoizeOne from 'memoize-one';
import { TableRow, TimeSeries } from './types';

type FilteredResults = {
  lastUpdated: Date;
  series: TimeSeries[];
  rows: TableRow[];
};

const getGlobalResults = memoizeOne(async function (): Promise<
  FilteredResults
> {
  const results = await import('./results_global.json');
  const change = results.rows.filter((row) => row.population > 1000000);
  const indexOfUs = change.findIndex((row) => row.region === 'United States');
  const changeSeries = change
    .slice(0, Math.min(indexOfUs + 1, change.length - 1))
    .map((change) => change.changeNormalizedSeries);
  const lastUpdated = parseJSON(results.lastUpdated);
  return { lastUpdated, series: changeSeries, rows: results.rows };
});

const getUsResults = memoizeOne(async function (): Promise<FilteredResults> {
  const results = await import('./results_us.json');
  const change = results.rows.filter((row) => row.population > 6073116);
  const indexOfMd = change.findIndex((row) => row.region === 'Maryland');
  const changeSeries = change
    .slice(0, Math.min(indexOfMd + 1, change.length - 1))
    .map((change) => change.changeNormalizedSeries);
  const lastUpdated = parseJSON(results.lastUpdated);
  return { lastUpdated, series: changeSeries, rows: results.rows };
});

type DataSets = 'global' | 'us';

const useResults = (dataset: DataSets): FilteredResults | undefined => {
  const [results, setResults] = React.useState<FilteredResults | undefined>(
    undefined
  );
  const global = dataset === 'global';
  React.useEffect(() => {
    !results && setResults(undefined);
    const promise = global ? getGlobalResults : getUsResults;
    promise().then((newResults) => {
      results !== newResults && setResults(newResults);
    });
  }, [global, results]);
  return results;
};

//test
const App = React.memo(() => {
  const [dataset, setDataSet] = React.useState<DataSets>('global');
  const global = dataset === 'global';
  const { rows, lastUpdated = undefined, series = [] } =
    useResults(dataset) || {};
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar lastUpdated={lastUpdated}>
          <RadioGroup
            row
            value={dataset}
            onChange={(event, value) => {
              setDataSet(value as DataSets);
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
          leftAxisLabel='New Cases (N)'
          height='22em'
          marginTop={0}
        />
        <Divider />
        {rows && <TablePane data={rows} hideRecovered={!global} />}
        {!rows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
});

export default App;
