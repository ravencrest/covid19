import React from 'react';
import { CssBaseline, Tooltip } from '@material-ui/core';
import { CellProps, Column } from 'react-table';
import { SimpleTable } from './SimpleTable';
import { TableRow } from '../types';

const Header = ({
  children,
  tooltip,
}: {
  children: React.ReactChild;
  tooltip: string;
}) => (
  <Tooltip title={tooltip}>
    <span
      style={{
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  </Tooltip>
);

function formatChange(change: number | undefined | null) {
  change = typeof change === 'number' ? Math.round(change * 100) : undefined;
  if (!change) {
    return '--';
  }
  return `${change > 0 ? '+' : ''}${change}%`;
}

const normalizedColumns: Column<TableRow>[] = [
  {
    Header: (
      <Header tooltip='Increase in new cases since last data'>Change</Header>
    ),
    accessor: 'change',
    id: 'change',
    Cell: ({ row }) => formatChange(row.original.change),
  },
  {
    Header: (
      <Header tooltip='Average weekly increase in new cases'>Change (W)</Header>
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
    accessor: 'casesNormalized',
  },
  {
    Header: <Header tooltip='Confirmed Deaths'>Deaths</Header>,
    accessor: 'deathsNormalized',
  },
  {
    Header: (
      <Header tooltip='Confirmed Recoveries'>
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
    accessor: 'recoveredNormalized',
  },
  {
    Header: <Header tooltip='Population'>Pop.</Header>,
    accessor: 'population',
  },
];

const standardColumns: Column<TableRow>[] = [
  {
    Header: <Header tooltip='Increase in new cases'>Change</Header>,
    accessor: 'change',
    id: 'change',
    Cell: ({ row }) => {
      let { change } = row.original;
      change =
        typeof change === 'number' ? Math.round(change * 100) : undefined;
      if (!change) {
        return '--';
      }
      return `${change > 0 ? '+' : ''}${change}%`;
    },
  },
  {
    Header: <Header tooltip='Region'>Region</Header>,
    accessor: 'region',
  },
  {
    Header: <Header tooltip='Confirmed Cases'>Cases</Header>,
    accessor: 'cases',
  },
  {
    Header: <Header tooltip='Confirmed Deaths'>Deaths</Header>,
    accessor: 'deaths',
  },
  {
    Header: (
      <Header tooltip='Confirmed Recoveries'>
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
    accessor: 'recovered',
  },
  {
    Header: <Header tooltip='Population'>Pop.</Header>,
    accessor: 'population',
  },
];

export const TablePane = ({
  data,
  hideRecovered,
  normalized,
}: {
  data: TableRow[];
  hideRecovered?: boolean;
  normalized: boolean;
}) => {
  const columns = normalized ? normalizedColumns : standardColumns;
  let filteredColumns = hideRecovered
    ? columns.filter(
        (f) =>
          f.accessor !== 'recovered' && f.accessor !== 'recoveredNormalized'
      )
    : columns;
  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <CssBaseline />
      <SimpleTable
        normalized={normalized}
        columns={filteredColumns}
        data={data}
        getCellProps={(cellInfo: CellProps<TableRow>) => {
          const value = cellInfo.value;
          const region = cellInfo.row.original.region;
          const columnId = cellInfo.column.id;
          const isChange = columnId === 'change' || columnId === 'weeklyChange';
          const shouldBold =
            region === 'United States' || region === 'Maryland';
          const color = !isChange
            ? undefined
            : !value
            ? undefined
            : value > 0
            ? 'red'
            : 'green';
          const fontWeight = shouldBold ? 'bold' : 'normal';
          return {
            style: {
              fontWeight,
              color,
            },
          };
        }}
      />
    </div>
  );
};
