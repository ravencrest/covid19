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
import {
  TableRow,
  DataSets,
  TimeSeries,
  Normalization,
  assertNever,
} from './types';
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

const normalizeGdp = (value: number | undefined, gdp: number | undefined) => {
  if (value === undefined || gdp === undefined) {
    return undefined;
  }
  return Math.round(value * gdp);
};

const normalizePop = (value: number | undefined, pop: number | undefined) => {
  if (value === undefined || pop === undefined) {
    return undefined;
  }
  return Math.round((value / pop) * 1000000);
};

const normalizeGdpPop = (
  value: number | undefined,
  gdp: number | undefined,
  pop: number | undefined
) => {
  return normalizePop(normalizeGdp(value, gdp), pop);
};

const rowToNormalizedGdpCases = (row: TableRow) =>
  normalizeGdp(row.cases, row.gdp);
const rowToNormalizedPopCases = (row: TableRow) =>
  normalizePop(row.cases, row.population);
const rowToNormalizedGdpPopCases = (row: TableRow) =>
  normalizeGdpPop(row.cases, row.gdp, row.population);
const rowToCases = (row: TableRow) => row.cases;

const rowToNormalizedGdpRecoveries = (row: TableRow) =>
  normalizeGdp(row.recovered, row.gdp);
const rowToNormalizedPopRecoveries = (row: TableRow) =>
  normalizePop(row.recovered, row.population);
const rowToNormalizedGdpPopRecoveries = (row: TableRow) =>
  normalizeGdpPop(row.recovered, row.gdp, row.population);
const rowToRecovered = (row: TableRow) => row.recovered;

const rowToNormalizedGdpDeaths = (row: TableRow) =>
  normalizeGdp(row.deaths, row.gdp);
const rowToNormalizedPopDeaths = (row: TableRow) =>
  normalizePop(row.deaths, row.population);
const rowToNormalizedGdpPopDeaths = (row: TableRow) =>
  normalizeGdpPop(row.deaths, row.gdp, row.population);
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
  switch (normalized) {
    case 'gdp+pop':
      return rowToNormalizedGdpPopCases;
    case 'gdp':
      return rowToNormalizedGdpCases;
    case 'pop':
      return rowToNormalizedPopCases;
    case 'none':
      return rowToCases;
    default:
      assertNever(normalized);
  }
};

export const getRecoveriesAccessor = (normalized: Normalization) => {
  switch (normalized) {
    case 'gdp+pop':
      return rowToNormalizedGdpPopRecoveries;
    case 'gdp':
      return rowToNormalizedGdpRecoveries;
    case 'pop':
      return rowToNormalizedPopRecoveries;
    case 'none':
      return rowToRecovered;
    default:
      assertNever(normalized);
  }
};

export const getDeathsAccessor = (normalized: Normalization) => {
  switch (normalized) {
    case 'gdp+pop':
      return rowToNormalizedGdpPopDeaths;
    case 'gdp':
      return rowToNormalizedGdpDeaths;
    case 'pop':
      return rowToNormalizedPopDeaths;
    case 'none':
      return rowToDeaths;
    default:
      assertNever(normalized);
  }
};

const NormalizeSwitch = ({
  norm,
  alt,
  label,
  onChange,
  currentValue,
}: {
  norm: Normalization;
  alt: Normalization;
  label: string;
  onChange: (normalization: Normalization) => void;
  currentValue: Normalization;
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={currentValue === norm || currentValue === 'gdp+pop'}
          onChange={(event, value) => {
            event.stopPropagation();
            const off =
              currentValue === 'gdp+pop' || currentValue === alt ? alt : 'none';
            const on = currentValue === alt ? 'gdp+pop' : norm;
            onChange(value ? on : off);
          }}
          name='normalized'
        />
      }
      label={label}
    />
  );
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
          let mapper:
            | undefined
            | ((value: number | undefined) => number | undefined);
          switch (normalized) {
            case 'pop':
              mapper = (value: number | undefined) => normalizePop(value, pop);
              break;
            case 'gdp':
              mapper = (value: number | undefined) => normalizeGdp(value, gdp);
              break;
            case 'gdp+pop':
              mapper = (value: number | undefined) =>
                normalizeGdpPop(value, gdp, pop);
              break;
            case 'none':
              mapper = undefined;
              break;
            default:
              assertNever(normalized);
              break;
          }

          //TODO: Figure out why this null check isn't working in Typescript
          if (mapper) {
            const points = d.points.map((p) => ({
              ...p,
              value: mapper && mapper(p.value),
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
          <NormalizeSwitch
            label='Norm GDP'
            norm='gdp'
            alt='pop'
            onChange={onNormalizedChange}
            currentValue={normalized}
          />
          <NormalizeSwitch
            label='Norm Pop'
            norm='pop'
            alt='gdp'
            onChange={onNormalizedChange}
            currentValue={normalized}
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
              marginTop={10}
              marginRight={200}
              marginLeft={normalized === 'gdp+pop' ? 100 : undefined}
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
