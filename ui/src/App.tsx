import React from 'react';
import data from './results.json';
import { TablePane } from './table/TablePane';
import { parseJSON } from 'date-fns';
import { LineChart } from './line-chart/LineChart';
import { InfoMenuBar } from './info-menubar/InfoMenuBar';
import { Divider } from '@material-ui/core';
const changeSeries = (function () {
  const change = data.rows.filter((row) => row.population > 1000000);
  const indexOfUs = change.findIndex((row) => row.region === 'United States');
  const changeSeries = change
    .slice(0, Math.min(indexOfUs + 1, change.length - 1))
    .map((change) => change.changeNormalizedSeries);
  return changeSeries;
})();

const lastUpdated: Date = parseJSON(data.lastUpdated);

const App = () => {
  const { rows } = data;

  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <InfoMenuBar lastUpdated={lastUpdated} />
      <LineChart
        data={changeSeries}
        leftAxisLabel='New Cases (N)'
        height='22em'
        marginTop={0}
      />
      <Divider />
      <TablePane data={rows} />
    </div>
  );
};

export default App;
