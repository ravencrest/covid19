import React from 'react';
import { CssBaseline } from '@material-ui/core';
import { Row } from 'react-table';
import { TableRow, DataSets, Normalization } from '../types';
import { SeriesTableRow } from './SeriesTableRow';
import { buildColumns } from './TablePane';
import { Column, SimpleTable } from './SimpleTable';
export default React.memo(function TablePane({
  data,
  dataset,
  normalized,
}: {
  data: TableRow[];
  dataset: DataSets;
  normalized: Normalization;
}) {
  const filteredColumns = React.useMemo(
    () => buildColumns(normalized, dataset),
    [normalized, dataset]
  );
  const rowBuilder = React.useCallback(
    (
      row: Row<TableRow>,
      columns: ReadonlyMap<string, Column<TableRow>>,
      i: number
    ) => (
      <SeriesTableRow
        {...row.getRowProps()}
        key={`${i}-${dataset}`}
        rowNumber={i}
        row={row}
        normalized={normalized}
        dataset={dataset}
        columnIndex={columns}
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
