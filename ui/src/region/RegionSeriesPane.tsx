import React from 'react';
import { Paper } from '@material-ui/core';
import { SeriesPaneHeader } from './SeriesPaneHeader';
import { DataSets, Normalization, Point, TableRow, TimeSeries } from '../types';
import { getGlobalCases, getGlobalDeaths, getUsCases, getUsDeaths, getUsTests } from '../data-mappers';
import { SevenDayAverageNormalizer } from '../dataset/DatasetView';

const LineChart = React.lazy(() => import('../line-chart/LineChart'));
const CalendarChart = React.lazy(() => import('../calendar-chart/CalendarChart'));

export const SeriesPanel = ({
  normalized,
  dataset,
  region,
  row,
}: {
  normalized: Normalization[];
  dataset: DataSets;
  region: string;
  row: TableRow;
}) => {
  const [ds, setDs] = React.useState<TimeSeries | undefined>();
  const [cs, setCs] = React.useState<TimeSeries | undefined>();
  const [ts, setTs] = React.useState<TimeSeries | undefined>();

  const { population, gdp } = row;
  React.useEffect(() => {
    let csFunc: () => Promise<Record<string, TimeSeries>>;
    let dsFunc: () => Promise<Record<string, TimeSeries>>;
    let tsFunc;

    if (dataset === 'global') {
      dsFunc = getGlobalDeaths;
      csFunc = getGlobalCases;
      tsFunc = () => Promise.resolve() as Promise<undefined | Record<string, TimeSeries>>;
    } else {
      dsFunc = getUsDeaths;
      csFunc = getUsCases;
      tsFunc = getUsTests;
    }
    tsFunc().then((testsSeries) => {
      let ts = testsSeries && testsSeries[row.code];
      let tests = ts?.points;
      let testsIndex: Map<string, number> | undefined;
      if (tests) {
        testsIndex = new Map<string, number>();
        for (let test of tests) {
          testsIndex.set(test.date, test.value);
        }
      } else {
        testsIndex = undefined;
      }

      csFunc().then((data) => {
        let d = data[region];
        let nor = new SevenDayAverageNormalizer();
        let points = d.points;

        if (normalized.includes('pop')) {
          points = points.map((point) => {
            return {
              ...point,
              value: Math.round((point.value / population) * 1000000),
            };
          });
        }
        if (normalized.includes('gdp')) {
          if (gdp !== undefined) {
            points = points.map((point) => {
              return { ...point, value: point.value * gdp };
            });
          } else {
            points = [];
          }
        }
        if (normalized.includes('tests')) {
          points = points.map((point, i) => {
            return {
              ...point,
              value: (point.value / (testsIndex?.get(point.date) || NaN)) * 1000,
            };
          });
        }
        points = points.map((p) => nor.calc(p)).filter((p) => !!p) as Point[];
        setCs({ ...d, points });
      });

      dsFunc().then((data) => {
        let d = data[region];
        let nor = new SevenDayAverageNormalizer();
        let points = d.points;

        if (normalized.includes('pop')) {
          points = points.map((point) => {
            return {
              ...point,
              value: (point.value / population) * 1000000,
            };
          });
        }
        if (normalized.includes('gdp')) {
          if (gdp !== undefined) {
            points = points.map((point) => {
              return { ...point, value: point.value * gdp };
            });
          } else {
            points = [];
          }
        }
        if (normalized.includes('tests')) {
          points = points.map((point, i) => {
            return {
              ...point,
              value: (point.value / (testsIndex?.get(point.date) || NaN)) * 1000,
            };
          });
        }
        points = points.map((p) => nor.calc(p)).filter((p) => !!p) as Point[];
        setDs({ ...d, points });
      });
      setTs(ts);
    });
  }, [setDs, setCs, dataset, normalized, region, population, gdp]);
  return (
    <Paper>
      <SeriesPaneHeader>New deaths and cases (7-day Average)</SeriesPaneHeader>
      <LineChart
        data={[cs, ds].filter((s) => !!s) as TimeSeries[]}
        leftAxisLabel='change'
        marginTop={10}
        dataKey='label'
      />
      <SeriesPaneHeader>New cases (7-day Average)</SeriesPaneHeader>
      {cs && <CalendarChart data={cs} />}
      <SeriesPaneHeader>New deaths (7-day Average)</SeriesPaneHeader>
      {ds && <CalendarChart data={ds} />}
      <SeriesPaneHeader>New tests</SeriesPaneHeader>
      {ts && <CalendarChart data={ts} />}
    </Paper>
  );
};
