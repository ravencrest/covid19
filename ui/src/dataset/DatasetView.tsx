import React from 'react';
import {
  CircularProgress,
  Divider,
  ExpansionPanel,
  ExpansionPanelSummary,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { assertNever, DataSets, Normalization, Point, TableRow, TimeSeries } from '../types';
import { NormalizeSwitch } from './NormalizeSwitch';
import { getCasesTimeSeries } from '../data-mappers';
import { parseISO, sub, isBefore, startOfDay } from 'date-fns';

const LineChart = React.lazy(() => import('../line-chart/LineChart'));
const InfoMenuBar = React.lazy(() => import('../info-menubar/InfoMenuBar'));
const TablePane = React.lazy(() => import('../table/TablePane'));
const ChoroplethChart = React.lazy(() => import('../choropleth-chart/ChoroplethChart'));

const getUsIndex = (it: TableRow) => it.region === 'United States';
const getMdIndex = (it: TableRow) => it.region === 'Maryland';

const normalizeGdp = (value: number | undefined, gdp: number | undefined) => {
  if (value === undefined || gdp === undefined) {
    return undefined;
  }
  return Math.ceil(value * (gdp || 1));
};

const normalizePop = (value: number | undefined, pop: number | undefined) => {
  if (value === undefined || pop === undefined) {
    return undefined;
  }
  return Math.ceil((value / pop) * 1000000);
};

const normalizeGdpPop = (value: number | undefined, gdp: number | undefined, pop: number | undefined) => {
  return normalizePop(normalizeGdp(value, gdp), pop);
};

export class SevenDayAverageNormalizer {
  private queue: Point[] = [];

  calc = (point: Point) => {
    const { queue } = this;
    queue.push(point);
    const now = startOfDay(parseISO(queue[0].date));
    const start = sub(now, { days: 7 });
    while (queue.length > 1 && isBefore(startOfDay(parseISO(queue[0].date)), start)) {
      queue.shift();
    }
    return { ...point, value: Math.ceil(queue.reduce((a, b) => a + b.value, 0) / queue.length) };
  };
}

const rowToNormalizedGdpCases = (row: TableRow) => normalizeGdp(row.cases, row.gdp);
const rowToNormalizedPopCases = (row: TableRow) => normalizePop(row.cases, row.population);
const rowToNormalizedGdpPopCases = (row: TableRow) => normalizeGdpPop(row.cases, row.gdp, row.population);
const rowToCases = (row: TableRow) => row.cases;

const rowToNormalizedGdpRecoveries = (row: TableRow) => normalizeGdp(row.recovered, row.gdp);
const rowToNormalizedPopRecoveries = (row: TableRow) => normalizePop(row.recovered, row.population);
const rowToNormalizedGdpPopRecoveries = (row: TableRow) => normalizeGdpPop(row.recovered, row.gdp, row.population);
const rowToRecovered = (row: TableRow) => row.recovered;

const rowToNormalizedGdpDeaths = (row: TableRow) => normalizeGdp(row.deaths, row.gdp);
const rowToNormalizedPopDeaths = (row: TableRow) => normalizePop(row.deaths, row.population);
const rowToNormalizedGdpPopDeaths = (row: TableRow) => normalizeGdpPop(row.deaths, row.gdp, row.population);
const rowToDeaths = (row: TableRow) => row.deaths;

type Props = {
  dataset: DataSets;
  rows: TableRow[];
  normalized: Normalization;
  lastUpdated: Date | undefined;
  onDatasetChange: (ds: DataSets) => void;
  onNormalizedChange: (normalized: Normalization) => void;
};

type RowMapper = (row: TableRow) => number | undefined;

type MapperConfig = {
  gdpPop: RowMapper;
  gdp: RowMapper;
  pop: RowMapper;
  none: RowMapper;
};

export const casesMapperConfig: MapperConfig = {
  gdpPop: rowToNormalizedGdpPopCases,
  gdp: rowToNormalizedGdpCases,
  pop: rowToNormalizedPopCases,
  none: rowToCases,
};

export const recoveriesMapperConfig: MapperConfig = {
  gdpPop: rowToNormalizedGdpPopRecoveries,
  gdp: rowToNormalizedGdpRecoveries,
  pop: rowToNormalizedPopRecoveries,
  none: rowToRecovered,
};

export const deathsMapperConfig: MapperConfig = {
  gdpPop: rowToNormalizedGdpPopDeaths,
  gdp: rowToNormalizedGdpDeaths,
  pop: rowToNormalizedPopDeaths,
  none: rowToDeaths,
};

export const getRowMapper = (normalization: Normalization, config: MapperConfig) => {
  switch (normalization) {
    case 'gdp+pop':
      return config.gdpPop;
    case 'gdp':
      return config.gdp;
    case 'pop':
      return config.pop;
    case 'none':
      return config.none;
    default:
      assertNever(normalization);
  }
};

export default function DatasetView({
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
  const [series, setSeries] = React.useState<TimeSeries[] | undefined>(undefined);

  React.useEffect(() => {
    const global = dataset === 'global';

    const populationLimit = global ? 1000000 : 6073116;
    const indexToSlice = global ? getUsIndex : getMdIndex;
    const indexOfMd = Math.max(rows?.findIndex(indexToSlice), 9) ?? 0;

    getCasesTimeSeries(dataset)().then((data) => {
      const newSeries = rows
        ?.filter((row) => row.population > populationLimit)
        .map((row) => {
          let d = data[row.region];
          if (!d) {
            return undefined;
          }
          // Tried refactoring this by giving the row mapper an optional value param and moving this to use that, but that broke the table view.
          const { population: pop, gdp } = row;
          let mapper: undefined | ((value: number | undefined) => number | undefined);
          switch (normalized) {
            case 'pop':
              mapper = (value: number | undefined) => normalizePop(value, pop);
              break;
            case 'gdp':
              mapper = (value: number | undefined) => normalizeGdp(value, gdp);
              break;
            case 'gdp+pop':
              mapper = (value: number | undefined) => normalizeGdpPop(value, gdp, pop);
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
          const norm = new SevenDayAverageNormalizer();
          d.points = d.points.map(norm.calc);

          return d;
        })
        .filter((s) => s != null)
        .slice(0, Math.min(indexOfMd + 1, rows?.length)) as TimeSeries[];
      setSeries(newSeries);
    });
  }, [rows, normalized, dataset, setSeries]);

  const worldAccessor = getRowMapper(normalized, casesMapperConfig);
  return (
    <div style={{ width: 1048, maxWidth: '95vw', margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar lastUpdated={lastUpdated} normalized={normalized} dataset={dataset}>
          <NormalizeSwitch label='GDP' norm='gdp' alt='pop' onChange={onNormalizedChange} currentValue={normalized} />
          <NormalizeSwitch label='Pop.' norm='pop' alt='gdp' onChange={onNormalizedChange} currentValue={normalized} />
          <RadioGroup
            row
            value={dataset}
            onChange={(event, value) => {
              event.stopPropagation();
              onDatasetChange(value as DataSets);
            }}
          >
            <FormControlLabel value='us' control={<Radio />} label='US' />
            <FormControlLabel value='global' control={<Radio />} label='Global' />
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
              <ChoroplethChart data={rows} accessor={worldAccessor} min={min} max={max} />
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
        {rows && <TablePane data={rows} dataset={dataset} normalized={normalized} />}
        {!rows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
}
