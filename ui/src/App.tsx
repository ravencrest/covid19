import React from 'react';
import globalResults from './results_global.json';
import usResults from './results_us.json';
import { TablePane } from './table/TablePane';
import { parseJSON } from 'date-fns';
import { LineChart } from './line-chart/LineChart';
import { InfoMenuBar } from './info-menubar/InfoMenuBar';
import {
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@material-ui/core';

const changeSeriesGlobal = (function () {
  const change = globalResults.rows.filter((row) => row.population > 1000000);
  const indexOfUs = change.findIndex((row) => row.region === 'United States');
  const changeSeries = change
    .slice(0, Math.min(indexOfUs + 1, change.length - 1))
    .map((change) => change.changeNormalizedSeries);
  return changeSeries;
})();

const changeSeriesUs = (function () {
  const change = usResults.rows.filter((row) => row.population > 6073116);
  const indexOfMd = change.findIndex((row) => row.region === 'Maryland');
  const changeSeries = change
    .slice(0, Math.min(indexOfMd + 1, change.length - 1))
    .map((change) => change.changeNormalizedSeries);
  return changeSeries;
})();

type DataSets = 'global' | 'us';

const App = () => {
  const [dataset, setDataSet] = React.useState<DataSets>('us');
  const global = dataset === 'global';
  const results = global ? globalResults : usResults;
  const lastUpdated = parseJSON(results.lastUpdated);
  const { rows } = results;
  const change = global ? changeSeriesGlobal : changeSeriesUs;
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <InfoMenuBar lastUpdated={lastUpdated}>
        <RadioGroup
          row
          value={dataset}
          onChange={(event, value) => {
            setDataSet(value as DataSets);
          }}
        >
          <FormControlLabel value='us' control={<Radio />} label='US' />
          <FormControlLabel value='global' control={<Radio />} label='Global' />
        </RadioGroup>
      </InfoMenuBar>
      <LineChart
        data={change}
        leftAxisLabel='New Cases (N)'
        height='22em'
        marginTop={0}
      />
      <Divider />
      <TablePane data={rows} hideRecovered={!global} />
    </div>
  );
};

export default App;
