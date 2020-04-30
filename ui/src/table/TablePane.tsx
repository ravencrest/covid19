import React from 'react';
import { CssBaseline, Tooltip } from '@material-ui/core';
import { Column, Row } from 'react-table';
import { SimpleTable } from './SimpleTable';
import { TableRow, DataSets } from '../types';
import { SeriesTableRow } from './SeriesTableRow';
import stylesM from './Table.module.css';

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

export const buildColumns = (
  normalized: boolean,
  dataset: DataSets
): Column<TableRow>[] => {
  const columns: Column<TableRow>[] = [
    {
      Header: (
        <Header
          tooltip='Increase in new cases since last data'
          className={stylesM.containerHidden}
        >
          Change
        </Header>
      ),
      accessor: 'change',
      id: 'change',
      Cell: ({ row }) => formatChange(row.original.change),
    },
    {
      Header: (
        <Header tooltip='Average weekly increase in new cases'>
          Change (W)
        </Header>
      ),
      accessor: 'weeklyChange',
      id: 'weeklyChange',
      Cell: ({ row }) => formatChange(row.original.weeklyChange),
    },
    {
      Header: <Header tooltip='Region'>Region</Header>,
      accessor: 'region',
    },
    {
      Header: <Header tooltip='Confirmed Cases'>Cases</Header>,
      accessor: normalized ? 'casesNormalized' : 'cases',
    },
    {
      Header: <Header tooltip='Confirmed Deaths'>Deaths</Header>,
      accessor: normalized ? 'deathsNormalized' : 'deaths',
    },
  ];

  if (dataset !== 'us') {
    columns.push({
      Header: (
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
      accessor: normalized ? 'recoveredNormalized' : 'recovered',
    });
  }
  columns.push({
    Header: <Header tooltip='Population'>Pop.</Header>,
    accessor: 'population',
  });
  return columns;
};

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
    (row: Row<TableRow>, i: number) => (
      <SeriesTableRow
        {...row.getRowProps()}
        key={`${i}-${datasetKey}`}
        row={row}
        rowNumber={i}
        series={
          normalized
            ? row.original.changeNormalizedSeries
            : row.original.changeSeries
        }
        normalized={normalized}
        dataset={datasetKey}
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
