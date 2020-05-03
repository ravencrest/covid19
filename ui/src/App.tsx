import React from 'react';
import {
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  CircularProgress,
  Switch,
  Typography,
  ExpansionPanel,
  ExpansionPanelSummary,
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { TableRow, DataSets, TimeSeries } from './types';
import {
  getGlobalCases,
  getGlobalCasesNormalized,
  getGlobalDeaths,
  getGlobalDeathsNormalized,
  getUsCases,
  getUsCasesNormalized,
  getUsDeaths,
  getUsDeathsNormalized,
} from './GlobalContext';

const LineChart = React.lazy(() => import('./line-chart/LineChart'));
const InfoMenuBar = React.lazy(() => import('./info-menubar/InfoMenuBar'));
const TablePane = React.lazy(() => import('./table/TablePane'));
const ChoroplethChart = React.lazy(() =>
  import('./choropleth-chart/ChoroplethChart')
);

const getUsIndex = (it: TableRow) => it.region === 'United States';
const getMdIndex = (it: TableRow) => it.region === 'Maryland';

const rowToNormalizedCases = (row: TableRow) => row.casesNormalized;
const rowToCases = (row: TableRow) => row.cases;

type Props = {
  dataset: DataSets;
  rows: TableRow[];
  normalized: boolean;
  lastUpdated: Date | undefined;
  onDatasetChange: (ds: DataSets) => void;
  onNormalizedChange: (normalized: boolean) => void;
};

export const changeMapper = (dataset: DataSets, normalized: boolean) => {
  let csFunc;

  if (normalized && dataset === 'global') {
    csFunc = getGlobalCasesNormalized;
  } else if (!normalized && dataset === 'global') {
    csFunc = getGlobalCases;
  } else if (normalized && dataset === 'us') {
    csFunc = getUsCasesNormalized;
  } else {
    csFunc = getUsCases;
  }
  return csFunc;
};

export const deathMapper = (dataset: DataSets, normalized: boolean) => {
  let dsFunc;

  if (normalized && dataset === 'global') {
    dsFunc = getGlobalDeathsNormalized;
  } else if (!normalized && dataset === 'global') {
    dsFunc = getGlobalDeaths;
  } else if (normalized && dataset === 'us') {
    dsFunc = getUsDeathsNormalized;
  } else {
    dsFunc = getUsDeaths;
  }
  return dsFunc;
};

export default function App({
  dataset,
  rows,
  normalized,
  lastUpdated,
  onDatasetChange,
  onNormalizedChange,
}: Props) {
  let min = 80;
  let max = 500;

  if (!normalized) {
    min = 2000;
    max = 200000;
  }
  const [series, setSeries] = React.useState<TimeSeries[] | undefined>(
    undefined
  );

  React.useEffect(() => {
    const global = dataset === 'global';

    const populationLimit = global ? 1000000 : 6073116;
    const indexToSlice = global ? getUsIndex : getMdIndex;
    const indexOfMd = rows?.findIndex(indexToSlice) ?? 0;

    changeMapper(dataset, normalized)().then((data) => {
      const newSeries = rows
        ?.filter((row) => row.population > populationLimit)
        .map((row) => data[row.region])
        .filter((s) => s != null)
        .slice(0, Math.min(indexOfMd + 1, rows?.length)) as TimeSeries[];
      setSeries(newSeries);
    });
  }, [rows, normalized, dataset, setSeries]);

  const worldAccessor = normalized ? rowToNormalizedCases : rowToCases;
  return (
    <div style={{ width: 1048, maxWidth: '95vw', margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar
          lastUpdated={lastUpdated}
          normalized={normalized}
          dataset={dataset}
        >
          <FormControlLabel
            control={
              <Switch
                checked={normalized}
                onChange={(event, value) => {
                  event.stopPropagation();
                  onNormalizedChange(value);
                }}
                name='normalized'
              />
            }
            label='Normalized'
          />
          <RadioGroup
            row
            value={dataset}
            onChange={(event, value) => {
              event.stopPropagation();
              onDatasetChange(value as DataSets);
            }}
          >
            <FormControlLabel value='us' control={<Radio />} label='US' />
            <FormControlLabel
              value='global'
              control={<Radio />}
              label='Global'
            />
          </RadioGroup>
        </InfoMenuBar>
        <React.Suspense fallback={<CircularProgress />}>
          {dataset === 'global' && rows && (
            <ExpansionPanel defaultExpanded>
              <ExpansionPanelSummary expandIcon={<ExpandMore />}>
                <Typography variant='h6' display='block' gutterBottom>
                  Total Cases
                </Typography>
              </ExpansionPanelSummary>
              <ChoroplethChart
                data={rows}
                accessor={worldAccessor}
                min={min}
                max={max}
              />
            </ExpansionPanel>
          )}
          <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMore />}>
              <Typography variant='h6' display='block' gutterBottom>
                New Cases Over Time
              </Typography>
            </ExpansionPanelSummary>
            <LineChart
              data={series}
              leftAxisLabel='New Cases'
              height='22em'
              marginTop={0}
              marginRight={200}
            />
          </ExpansionPanel>
        </React.Suspense>
        <Divider />
        {rows && (
          <TablePane data={rows} datasetKey={dataset} normalized={normalized} />
        )}
        {!rows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
}
