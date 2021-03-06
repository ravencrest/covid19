import React from 'react';
import { CssBaseline, Tooltip } from '@material-ui/core';
import { Row } from 'react-table';
import { Column, SimpleTable } from './SimpleTable';
import { TableRow, DataSets, Normalization } from '../types';
import { SeriesTableRow } from '../region/SeriesTableRow';
import stylesM from './Table.module.css';
import memoizeOne from 'memoize-one';
import { getRowMapper, casesMapperConfig, deathsMapperConfig, recoveriesMapperConfig } from '../dataset/DatasetView';
import * as d3 from 'd3-format';

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
  change = typeof change === 'number' ? change : undefined;
  if (!change) {
    return '--';
  }
  return `${change > 0 ? '+' : ''}${change}%`;
}

const numberFormatter = d3.format(',');

function formatNumber(value: number | undefined | null) {
  if (value === null || value === undefined) {
    return '---';
  }
  return numberFormatter(value);
}

const currencyFormatter = d3.format('$,.2f');

function formatCurrency(value: number | undefined | null) {
  if (value === null || value === undefined) {
    return '---';
  }
  return currencyFormatter(value);
}

const populationFormatter = d3.format('.2s');
function formatPopulation(value: number | undefined | null) {
  if (value === null || value === undefined) {
    return '---';
  }
  return populationFormatter(value);
}

export const buildColumns = memoizeOne((normalized: Normalization, dataset: DataSets): Column<TableRow>[] => {
  const columns: Column<TableRow>[] = [
    {
      header: <Header tooltip='Average weekly increase in new cases'>Change (W)</Header>,
      accessor: 'weeklyChange',
      id: 'weeklyChange',
      cell: ({ value }) => formatChange(value),
    },
    {
      id: 'region',
      header: <Header tooltip='Region'>Region</Header>,
      accessor: 'region',
    },
    {
      id: 'cases',
      header: <Header tooltip='Confirmed Cases'>Cases</Header>,
      accessor: getRowMapper(normalized, casesMapperConfig),
      cell: ({ value }: { row: TableRow; value: any }) => formatNumber(value),
    },
    {
      id: 'deaths',
      header: <Header tooltip='Confirmed Deaths'>Deaths</Header>,
      accessor: getRowMapper(normalized, deathsMapperConfig),
      cell: ({ value }: { row: TableRow; value: any }) => formatNumber(value),
    },
  ];

  if (dataset !== 'us') {
    columns.push({
      header: (
        <Header tooltip='Confirmed Recoveries' className={stylesM.containerHidden}>
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
      accessor: getRowMapper(normalized, recoveriesMapperConfig),
      cell: ({ value }: { row: TableRow; value: any }) => formatNumber(value),
    });
  }
  columns.push({
    id: 'population',
    className: stylesM.containerHidden,
    header: <Header tooltip='Population'>Pop.</Header>,
    accessor: 'population',
    cell: ({ value }: { row: TableRow; value: any }) => formatPopulation(value),
  });
  columns.push({
    id: 'gdp',
    className: stylesM.containerHidden,
    header: <Header tooltip='GDP (Billions)'>GDP (B)</Header>,
    accessor: 'gdp',
    cell: ({ value }: { row: TableRow; value: any }) => formatCurrency(value),
  });
  return columns;
});

export default React.memo(function TablePane({
  data,
  dataset,
  normalized,
  embedded,
}: {
  data: TableRow[];
  dataset: DataSets;
  normalized: Normalization;
  embedded?: boolean;
}) {
  const filteredColumns = React.useMemo(() => buildColumns(normalized, dataset), [normalized, dataset]);
  const rowBuilder = React.useCallback(
    (row: Row<TableRow>, columns: ReadonlyMap<string, Column<TableRow>>, i: number) => (
      <SeriesTableRow
        {...row.getRowProps()}
        key={`${dataset}-${row.original.region}`}
        rowNumber={i}
        row={row}
        normalized={normalized}
        dataset={dataset}
        columnIndex={columns}
        embedded={embedded}
      />
    ),
    [normalized, dataset, embedded]
  );
  return (
    <>
      <CssBaseline />
      <SimpleTable embedded={embedded} rowBuilder={rowBuilder} columns={filteredColumns} data={data} />
    </>
  );
});
