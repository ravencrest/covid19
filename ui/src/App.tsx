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
import { TableRow, DataSets } from './types';

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

const App = React.memo(() => {
  const [dataset, setDataSet] = React.useState<DataSets>('global');
  const [normalized, setNormalized] = React.useState(true);
  const global = dataset === 'global';
  const { rows, lastUpdated = undefined } = useResults(dataset) ?? {};
  const populationLimit = global ? 1000000 : 6073116;
  const indexToSlice = global
    ? (it: TableRow) => it.region === 'United States'
    : (it: TableRow) => it.region === 'Maryland';
  const changeMapper = normalized
    ? (row: TableRow) => row.changeNormalizedSeries
    : (row: TableRow) => row.changeSeries;
  const indexOfMd = rows?.findIndex(indexToSlice) ?? 0;
  const series = rows
    ?.filter((row) => row.population > populationLimit)
    .map(changeMapper)
    .slice(0, Math.min(indexOfMd + 1, rows?.length - 1));

  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar lastUpdated={lastUpdated}>
          <FormControlLabel
            control={
              <Switch
                checked={normalized}
                onChange={(event, value) => {
                  setNormalized(value);
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
          data={series ?? []}
          leftAxisLabel='New Cases (N)'
          height='22em'
          marginTop={0}
        />
        <Divider />
        {rows && (
          <TablePane
            data={rows}
            hideRecovered={dataset}
            normalized={normalized}
          />
        )}
        {!rows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
});

export default App;
