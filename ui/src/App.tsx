import React from 'react';
import data from './results.json';
import { TablePane } from './table/TablePane';
import { formatRelative as format, parseJSON } from 'date-fns';
import { MyResponsiveLine } from './line-chart/LineChart';
import clsx from 'clsx';
import { Chip, makeStyles } from '@material-ui/core';

const useLastUpdatedStyles = makeStyles((theme) => ({
  root: {
    marginLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
}));

const App = () => {
  const { rows, lastUpdated: lastUpdatedRaw, change, growth } = data;
  const lastUpdated: Date = parseJSON(lastUpdatedRaw);
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <Chip
        label={`Last updated ${format(lastUpdated, new Date())}`}
        className={clsx(useLastUpdatedStyles().root)}
      />
      <MyResponsiveLine data={change} leftAxisLabel='New Cases (N)' />
      <TablePane data={rows} />
    </div>
  );
};

export default App;
