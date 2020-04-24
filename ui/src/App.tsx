import React from 'react';
import data from './results.json';
import { TablePane } from './table/TablePane';
import { formatRelative as format, parseJSON } from 'date-fns';
import { LineChart } from './line-chart/LineChart';
import clsx from 'clsx';
import { Chip, makeStyles } from '@material-ui/core';

const useLastUpdatedStyles = makeStyles((theme) => ({
  root: {
    marginLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
}));

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
      <Chip
        label={`Last updated ${format(lastUpdated, new Date())}`}
        className={clsx(useLastUpdatedStyles().root)}
      />
      <LineChart data={changeSeries} leftAxisLabel='New Cases (N)' />
      <TablePane data={rows} />
    </div>
  );
};

export default App;
