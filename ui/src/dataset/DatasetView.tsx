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
import { DataSets, Normalization, Point, TableRow, TimeSeries } from '../types';
import { NormalizeSwitch } from './NormalizeSwitch';
import { getCasesTimeSeries, getUsTests } from '../data-mappers';
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

const normalizeTests = (value: number | undefined, tests: number | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  return Math.ceil(((value || 1) / (tests || 1)) * 1000);
};

const normalizeTestsGdp = (value: number | undefined, tests: number | undefined, gdp: number | undefined) => {
  return normalizeGdp(normalizeTests(value, tests), gdp);
};

const normalizeTestsPop = (value: number | undefined, tests: number | undefined, pop: number | undefined) => {
  return normalizePop(value, pop);
};

const normalizeTestsGdpPop = (
  value: number | undefined,
  tests: number | undefined,
  gdp: number | undefined,
  pop: number | undefined
) => {
  return normalizeGdpPop(normalizeTests(value, tests), gdp, pop);
};

export class SevenDayAverageNormalizer {
  private queue: Point[] = [];
  private count = -1;

  calc = (point: Point) => {
    const { queue } = this;
    if (Number.isNaN(point.value)) {
      return undefined;
    }
    queue.push(point);
    this.count++;
    if (queue.length > 2 && this.count > 7) {
      queue.shift();
    }
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
const rowToNormalizedTestsCases = (row: TableRow) => {
  return normalizeTests(row.cases, row.tests);
};
const rowToNormalizedTestsGdpCases = (row: TableRow) => normalizeGdp(row.tests, row.gdp);
const rowToNormalizedTestsPopCases = (row: TableRow) => normalizePop(row.tests, row.population);
const rowToNormalizedTestsGdpPopCases = (row: TableRow) => normalizeGdpPop(row.tests, row.gdp, row.population);

const rowToCases = (row: TableRow) => row.cases;
const rowToTests = (row: TableRow) => row.tests;

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
  normalized: Normalization[];
  lastUpdated: Date | undefined;
  onDatasetChange: (ds: DataSets) => void;
  onNormalizedChange: (normalized: Normalization[]) => void;
  tests?: Record<string, TimeSeries>;
};

type RowMapper = (row: TableRow) => number | undefined;

type MapperConfig = {
  gdpPop: RowMapper;
  gdp: RowMapper;
  pop: RowMapper;
  none: RowMapper;
  tests?: RowMapper;
  testsGdp?: RowMapper;
  testsPop?: RowMapper;
  testsGdpPop?: RowMapper;
};

export const casesMapperConfig: MapperConfig = {
  gdpPop: rowToNormalizedGdpPopCases,
  gdp: rowToNormalizedGdpCases,
  pop: rowToNormalizedPopCases,
  none: rowToCases,
  tests: rowToNormalizedTestsCases,
  testsGdp: rowToNormalizedTestsGdpCases,
  testsPop: rowToNormalizedTestsPopCases,
  testsGdpPop: rowToNormalizedTestsGdpPopCases,
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

export const testsMapperConfig: MapperConfig = {
  gdp: rowToNormalizedTestsGdpCases,
  pop: rowToNormalizedTestsPopCases,
  gdpPop: rowToNormalizedTestsGdpPopCases,
  none: rowToTests,
  tests: rowToTests,
  testsGdp: rowToNormalizedTestsGdpCases,
  testsPop: rowToNormalizedTestsPopCases,
  testsGdpPop: rowToNormalizedTestsGdpPopCases,
};

export const getRowMapper = (normalized: Normalization[], config: MapperConfig) => {
  let mapper;
  if (!normalized || normalized.includes('none')) {
    mapper = config.none;
  } else if (normalized.length === 1 && normalized.includes('gdp')) {
    mapper = config.gdp;
  } else if (normalized.length === 1 && normalized.includes('pop')) {
    mapper = config.pop;
  } else if (normalized.length === 2 && normalized.includes('gdp') && normalized.includes('pop')) {
    mapper = config.gdpPop;
  } else if (normalized.length === 2 && normalized.includes('tests') && normalized.includes('gdp')) {
    mapper = config.testsGdp;
  } else if (normalized.length === 2 && normalized.includes('tests') && normalized.includes('pop')) {
    mapper = config.testsPop;
  } else if (
    normalized.length === 3 &&
    normalized.includes('tests') &&
    normalized.includes('gdp') &&
    normalized.includes('pop')
  ) {
    mapper = config.testsGdpPop;
  }
  return mapper || config.none;
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

  if (!normalized || normalized.includes('none')) {
    min = 2000;
    max = 200000;
  } else if (normalized.length === 1 && normalized.includes('gdp')) {
    min = 30000;
    max = 200000000;
  } else if (normalized.length === 2 && normalized.includes('gdp') && normalized.includes('pop')) {
    min = 21000;
    max = 1900000;
  }
  const [series, setSeries] = React.useState<TimeSeries[] | undefined>(undefined);
  const [tests, setTests] = React.useState<Record<string, TimeSeries> | undefined>(undefined);

  React.useEffect(() => {
    const global = dataset === 'global';

    const populationLimit = global ? 1000000 : 6073116;
    const indexToSlice = global ? getUsIndex : getMdIndex;
    const indexOfMd = Math.max(rows?.findIndex(indexToSlice), 9) ?? 0;

    !global &&
      getUsTests().then((t) => {
        setTests(t);
      });

    global && tests && setTests(undefined);

    getCasesTimeSeries(dataset)().then((data) => {
      const newSeries = rows
        ?.filter((row) => row.population > populationLimit)
        .map((row) => {
          let d = data[row.region];
          if (!d) {
            return undefined;
          }
          // Tried refactoring this by giving the row mapper an optional value param and moving this to use that, but that broke the table view.
          const { population: pop, gdp, code } = row;
          const mapper = (value: number | undefined) => {
            if (normalized.includes('pop')) {
              value = normalizePop(value, pop);
            }
            if (normalized.includes('gdp')) {
              value = normalizeGdp(value, gdp);
            }
            if (normalized.includes('tests')) {
              const points = tests && tests[code]?.points;
              const point = points && !!points.length ? points[points.length - 1]?.value : undefined;
              value = normalizeTests(value, point);
            }
            return value;
          };

          //TODO: Figure out why this null check isn't working in Typescript
          const norm = new SevenDayAverageNormalizer();

          const points: Point[] = d.points.map((p) => ({
            ...p,
            value: (mapper ? mapper(p.value) : p.value) ?? p.value,
          }));

          return { ...d, points: points.map((p) => norm.calc(p)) } as TimeSeries;
        })
        .filter((s) => s != null)
        .slice(0, Math.min(indexOfMd + 1, rows?.length)) as TimeSeries[];
      setSeries(newSeries);
    });
  }, [rows, normalized, dataset, setSeries, tests, setTests]);

  const worldAccessor = getRowMapper(normalized, casesMapperConfig);
  return (
    <div style={{ width: 1048, maxWidth: '95vw', margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar lastUpdated={lastUpdated} normalized={normalized} dataset={dataset}>
          <NormalizeSwitch label='GDP' norm='gdp' onChange={onNormalizedChange} currentValue={normalized} />
          <NormalizeSwitch label='Pop.' norm='pop' onChange={onNormalizedChange} currentValue={normalized} />
          {
            <NormalizeSwitch
              label='Tests'
              norm='tests'
              onChange={onNormalizedChange}
              currentValue={normalized}
              disabled={dataset !== 'us'}
            />
          }
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
                  New Cases (7-day Average)
                </Typography>
              </ExpansionPanelSummary>
              <ChoroplethChart data={rows} accessor={worldAccessor} min={min} max={max} />
            </ExpansionPanel>
          )}
          <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMore />}>
              <Typography variant='h6' display='block' gutterBottom>
                New Cases (7-day Average)
              </Typography>
            </ExpansionPanelSummary>
            <LineChart
              data={series}
              leftAxisLabel='New Cases'
              height='22em'
              marginTop={10}
              marginRight={200}
              marginLeft={normalized.includes('gdp') && normalized.includes('pop') ? 100 : undefined}
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
