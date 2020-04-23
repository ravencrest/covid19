import React from 'react';
import data from './results.json';
import { TablePane } from './table/TablePane';
import { parseJSON } from 'date-fns';

const App = () => {
  const { rows, lastUpdated: lastUpdatedRaw } = data;
  const lastUpdated: Date = parseJSON(lastUpdatedRaw);
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <TablePane data={rows} lastUpdated={lastUpdated} />
    </div>
  );
};

export default App;
