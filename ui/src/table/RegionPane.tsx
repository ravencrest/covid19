import React from 'react';
import { CssBaseline } from '@material-ui/core';
import { Row } from 'react-table';
import { TableRow, DataSets } from '../types';
import { SeriesTableRow } from './SeriesTableRow';
import { buildColumns } from './TablePane';
import { Column, SimpleTable } from './SimpleTable';
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
    (
      row: Row<TableRow>,
      columnIndex: ReadonlyMap<string, Column<TableRow>>,
      i: number
    ) => (
      <SeriesTableRow
        embedded
        {...row.getRowProps()}
        rowNumber={i}
        key={`${i}`}
        row={row}
        series={
          normalized
            ? row.original.changeNormalizedSeries
            : row.original.changeSeries
        }
        normalized={normalized}
        dataset={dataset}
        columnIndex={columnIndex}
      />
    ),
    [normalized, dataset]
  );
  return (
    <>
      <CssBaseline />
      <SimpleTable
        embedded
        rowBuilder={rowBuilder}
        columns={filteredColumns}
        data={data}
      />
    </>
  );
});
