import React from 'react';
import data from './results.json';
import { TablePane } from './table/TablePane';

const App = () => {
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <TablePane data={data} />
    </div>
  );
};

export default App;
