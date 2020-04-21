import React from 'react'
import { CssBaseline, Tooltip } from '@material-ui/core'
import { CellProps, Column } from "react-table";
import { EnhancedTable, Point } from './components/EnhancedTable'
import data from './results.json';

const Header = ({children, tooltip}: { children: string; tooltip: string }) => (
  <Tooltip title={tooltip}>
  <span style={{
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
  </Tooltip>
);

const columns: Column<Point>[] = [
  {
    Header: <Header tooltip='Rank (Normalized per 100,000 people)'>Rank (N)</Header>,
    accessor: 'rank',
  },
  {
    Header: <Header tooltip='Region'>Region</Header>,
    accessor: 'country',
  },
  {
    Header: <Header tooltip='Confirmed Cases (Normalized per 100,000 people)'>Cases (N)</Header>,
    accessor: 'normalizedValue',
  },
  {
    Header: <Header tooltip='Confirmed Cases'>Cases</Header>,
    accessor: 'rawValue',
  },
  {
    Header: <Header tooltip='Population'>Pop</Header>,
    accessor: 'population',
  }
]

const App = () => {
  return (
    <div style={{maxWidth: 1024, margin: 'auto'}}>
      <CssBaseline />
      <EnhancedTable
        columns={columns}
        data={data}
        getCellProps={(cellInfo: CellProps<Point>) => ({
          style: {
            fontWeight: cellInfo.row.original.country === 'United States' ? 'bold' : 'normal'
          },
        })}
      />
    </div>
  )
}

export default App
