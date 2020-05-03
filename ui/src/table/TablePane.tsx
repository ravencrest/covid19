import React from 'react';
import { CssBaseline, Tooltip } from '@material-ui/core';
import { Row } from 'react-table';
import { Column, SimpleTable } from './SimpleTable';
import { TableRow, DataSets } from '../types';
import { SeriesTableRow } from './SeriesTableRow';
import stylesM from './Table.module.css';
import memoizeOne from 'memoize-one';

export const Header = ({
  children,
  tooltip,
  className,
}: {
  children: React.ReactChild;
  tooltip: string;
  className?: string;
}) => (
  <Tooltip title={tooltip} className={className}>
    <span>{children}</span>
  </Tooltip>
);

export function formatChange(change: number | undefined | null) {
  change = typeof change === 'number' ? Math.round(change * 100) : undefined;
  if (!change) {
    return '--';
  }
  return `${change > 0 ? '+' : ''}${change}%`;
}

export const buildColumns = memoizeOne(
  (normalized: boolean, dataset: DataSets): Column<TableRow>[] => {
    const columns: Column<TableRow>[] = [
      {
        header: (
          <Header
            tooltip='Increase in new cases since last data'
            className={stylesM.containerHidden}
          >
            Change
          </Header>
        ),
        className: stylesM.containerHidden,
        accessor: 'change',
        id: 'change',
        cell: ({ row, value }) => formatChange(value),
      },
      {
        header: (
          <Header tooltip='Average weekly increase in new cases'>
            Change (W)
          </Header>
        ),
        accessor: 'weeklyChange',
        id: 'weeklyChange',
        cell: ({ row, value }) => formatChange(value),
      },
      {
        id: 'region',
        header: <Header tooltip='Region'>Region</Header>,
        accessor: 'region',
      },
      {
        id: 'cases',
        header: <Header tooltip='Confirmed Cases'>Cases</Header>,
        accessor: normalized ? 'casesNormalized' : 'cases',
      },
      {
        id: 'deaths',
        header: <Header tooltip='Confirmed Deaths'>Deaths</Header>,
        accessor: normalized ? 'deathsNormalized' : 'deaths',
      },
    ];

    if (dataset !== 'us') {
      columns.push({
        header: (
          <Header
            tooltip='Confirmed Recoveries'
            className={stylesM.containerHidden}
          >
            <div style={{ display: 'flex' }}>
              <span
                style={{
                  maxWidth: '3rem',
                  textOverflow: 'ellipsis',
                  display: 'inline-block',
                  overflow: 'hidden',
                }}
              >
                Recoveries
              </span>
            </div>
          </Header>
        ),
        id: 'recovered',
        className: stylesM.containerHidden,
        accessor: normalized ? 'recoveredNormalized' : 'recovered',
      });
    }
    columns.push({
      id: 'population',
      className: stylesM.containerHidden,
      header: <Header tooltip='Population'>Pop.</Header>,
      accessor: 'population',
    });
    return columns;
  }
);

export default React.memo(function TablePane({
  data,
  datasetKey,
  normalized,
}: {
  data: TableRow[];
  datasetKey: DataSets;
  normalized: boolean;
}) {
  const filteredColumns = React.useMemo(
    () => buildColumns(normalized, datasetKey),
    [normalized, datasetKey]
  );
  const rowBuilder = React.useCallback(
    (
      row: Row<TableRow>,
      columns: ReadonlyMap<string, Column<TableRow>>,
      i: number
    ) => (
      <SeriesTableRow
        {...row.getRowProps()}
        key={`${i}-${datasetKey}`}
        rowNumber={i}
        row={row}
        normalized={normalized}
        dataset={datasetKey}
        columnIndex={columns}
      />
    ),
    [normalized, datasetKey]
  );
  return (
    <>
      <CssBaseline />
      <SimpleTable
        rowBuilder={rowBuilder}
        columns={filteredColumns}
        data={data}
      />
    </>
  );
});
