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
import { TableRow, DataSets, TimeSeries, Normalization } from './types';
import {
  getGlobalCases,
  getGlobalDeaths,
  getUsCases,
  getUsDeaths,
} from './GlobalContext';

const LineChart = React.lazy(() => import('./line-chart/LineChart'));
const InfoMenuBar = React.lazy(() => import('./info-menubar/InfoMenuBar'));
const TablePane = React.lazy(() => import('./table/TablePane'));
const ChoroplethChart = React.lazy(() =>
  import('./choropleth-chart/ChoroplethChart')
);

const getUsIndex = (it: TableRow) => it.region === 'United States';
const getMdIndex = (it: TableRow) => it.region === 'Maryland';

const rowToNormalizedGdpCases = (row: TableRow) => {
  const { cases, gdp } = row;
  if (cases === undefined || gdp === undefined) {
    return undefined;
  }
  return Math.round(cases * gdp);
};

const rowToNormalizedPopCases = (row: TableRow) => {
  const { cases, population: pop } = row;
  if (cases === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round((cases / pop) * 1000000);
};

const rowToNormalizedGdpPopCases = (row: TableRow) => {
  const { cases, gdp, population: pop } = row;
  if (cases === undefined || gdp === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round(((cases * gdp) / pop) * 1000000);
};

const rowToCases = (row: TableRow) => row.cases;

const rowToNormalizedGdpRecoveries = (row: TableRow) => {
  const { recovered: cases, gdp } = row;
  if (cases === undefined || gdp === undefined) {
    return undefined;
  }
  return Math.round(cases * gdp);
};

const rowToNormalizedPopRecoveries = (row: TableRow) => {
  const { recovered: cases, population: pop } = row;
  if (cases === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round((cases / pop) * 1000000);
};

const rowToNormalizedGdpPopRecoveries = (row: TableRow) => {
  const { recovered: cases, gdp, population: pop } = row;
  if (cases === undefined || gdp === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round(((cases * gdp) / pop) * 1000000);
};

const rowToRecovered = (row: TableRow) => row.recovered;

const rowToNormalizedGdpDeaths = (row: TableRow) => {
  const { deaths: cases, gdp } = row;
  if (cases === undefined || gdp === undefined) {
    return undefined;
  }
  return Math.round(cases * gdp);
};

const rowToNormalizedPopDeaths = (row: TableRow) => {
  const { deaths: cases, population: pop } = row;
  if (cases === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round((cases / pop) * 1000000);
};

const rowToNormalizedGdpPopDeaths = (row: TableRow) => {
  const { deaths: cases, gdp, population: pop } = row;
  if (cases === undefined || gdp === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round(((cases * gdp) / pop) * 1000000);
};

const rowToDeaths = (row: TableRow) => row.deaths;

type Props = {
  dataset: DataSets;
  rows: TableRow[];
  normalized: Normalization;
  lastUpdated: Date | undefined;
  onDatasetChange: (ds: DataSets) => void;
  onNormalizedChange: (normalized: Normalization) => void;
};

export const changeMapper = (dataset: DataSets) => {
  let csFunc;

  if (dataset === 'global') {
    csFunc = getGlobalCases;
  } else {
    csFunc = getUsCases;
  }
  return csFunc;
};

export const deathMapper = (dataset: DataSets) => {
  let dsFunc;

  if (dataset === 'global') {
    dsFunc = getGlobalDeaths;
  } else {
    dsFunc = getUsDeaths;
  }
  return dsFunc;
};

export const getAccessor = (normalized: Normalization) => {
  return normalized === 'gdp+pop'
    ? rowToNormalizedGdpPopCases
    : normalized === 'gdp'
    ? rowToNormalizedGdpCases
    : normalized === 'pop'
    ? rowToNormalizedPopCases
    : rowToCases;
};

export const getRecoveriesAccessor = (normalized: Normalization) => {
  return normalized === 'gdp+pop'
    ? rowToNormalizedGdpPopRecoveries
    : normalized === 'gdp'
    ? rowToNormalizedGdpRecoveries
    : normalized === 'pop'
    ? rowToNormalizedPopRecoveries
    : rowToRecovered;
};

export const getDeathsAccessor = (normalized: Normalization) => {
  return normalized === 'gdp+pop'
    ? rowToNormalizedGdpPopDeaths
    : normalized === 'gdp'
    ? rowToNormalizedGdpDeaths
    : normalized === 'pop'
    ? rowToNormalizedPopDeaths
    : rowToDeaths;
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

  if (!normalized || normalized === 'none') {
    min = 2000;
    max = 200000;
  } else if (normalized === 'gdp') {
    min = 30000;
    max = 200000000;
  } else if (normalized === 'gdp+pop') {
    min = 21000;
    max = 1900000;
  }
  const [series, setSeries] = React.useState<TimeSeries[] | undefined>(
    undefined
  );

  React.useEffect(() => {
    const global = dataset === 'global';

    const populationLimit = global ? 1000000 : 6073116;
    const indexToSlice = global ? getUsIndex : getMdIndex;
    const indexOfMd = Math.max(rows?.findIndex(indexToSlice), 9) ?? 0;

    changeMapper(dataset)().then((data) => {
      const newSeries = rows
        ?.filter((row) => row.population > populationLimit)
        .map((row) => {
          let d = data[row.region];
          if (!d) {
            return undefined;
          }
          const { population: pop, gdp } = row;
          if (normalized === 'pop') {
            const points = d.points.map((p) => ({
              ...p,
              value: (p.value / pop) * 1000000,
            }));
            return { ...d, points } as TimeSeries;
          } else if (normalized === 'gdp') {
            if (gdp === undefined || gdp === null) {
              return { ...d, points: [] } as TimeSeries;
            }
            let points = d.points.map((p) => ({ ...p, value: p.value * gdp }));
            return { ...d, points } as TimeSeries;
          } else if (normalized === 'gdp+pop') {
            if (gdp === undefined || gdp === null) {
              return { ...d, points: [] } as TimeSeries;
            }
            let points = d.points.map((p) => ({
              ...p,
              value: (p.value * gdp) / pop,
            }));
            return { ...d, points } as TimeSeries;
          }
          return d;
        })
        .filter((s) => s != null)
        .slice(0, Math.min(indexOfMd + 1, rows?.length)) as TimeSeries[];
      setSeries(newSeries);
    });
  }, [rows, normalized, dataset, setSeries]);

  const worldAccessor = getAccessor(normalized);
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
                checked={normalized === 'gdp' || normalized === 'gdp+pop'}
                onChange={(event, value) => {
                  event.stopPropagation();
                  const off =
                    normalized === 'gdp+pop' || normalized === 'pop'
                      ? 'pop'
                      : 'none';
                  const on = normalized === 'pop' ? 'gdp+pop' : 'gdp';
                  onNormalizedChange(value ? on : off);
                }}
                name='normalized'
              />
            }
            label='Norm GDP'
          />
          <FormControlLabel
            control={
              <Switch
                checked={normalized === 'pop' || normalized === 'gdp+pop'}
                onChange={(event, value) => {
                  event.stopPropagation();
                  const off =
                    normalized === 'gdp+pop' || normalized === 'gdp'
                      ? 'gdp'
                      : 'none';
                  const on = normalized === 'gdp' ? 'gdp+pop' : 'pop';
                  onNormalizedChange(value ? on : off);
                }}
                name='normalized'
              />
            }
            label='Norm Pop'
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
