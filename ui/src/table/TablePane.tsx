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

const normalizedColumns: Column<TableRow>[] = [
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
        getCellProps={(cellInfo: CellProps<TableRow>) => ({
          style: {
            fontWeight:
              cellInfo.row.original.region === 'United States'
                ? 'bold'
                : 'normal',
            color:
              cellInfo.column.id !== 'change'
                ? undefined
                : !cellInfo.row.original.change
                ? undefined
                : cellInfo.row.original.change > 0
                ? 'red'
                : 'green',
          },
        })}
      />
    </div>
  );
};
