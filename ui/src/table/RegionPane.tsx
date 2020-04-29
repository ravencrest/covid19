import React from 'react';
import { CssBaseline } from '@material-ui/core';
import { Row } from 'react-table';
import { TableRow, DataSets } from '../types';
import { SeriesTableRow } from './SeriesTableRow';
import SingleRegionTable from './SingleRegionTable';
import { buildColumns } from './TablePane';

export default React.memo(function RegionPane({
  data,
  normalized,
  dataset,
}: {
  data: TableRow[];
  normalized: boolean;
  dataset: DataSets;
}) {
  const filteredColumns = React.useMemo(
    () => buildColumns(normalized, dataset),
    [normalized, dataset]
  );
  const rowBuilder = React.useCallback(
    (row: Row<TableRow>, i: number) => (
      <SeriesTableRow
        hideIndex
        {...row.getRowProps()}
        key={`${i}`}
        row={row}
        rowNumber={i}
        series={
          normalized
            ? row.original.changeNormalizedSeries
            : row.original.changeSeries
        }
      />
    ),
    [normalized]
  );
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <CssBaseline />
      <SingleRegionTable
        rowBuilder={rowBuilder}
        columns={filteredColumns}
        data={data}
      />
    </div>
  );
});