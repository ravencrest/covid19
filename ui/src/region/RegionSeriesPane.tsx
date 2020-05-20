import React from 'react';
import { Paper } from '@material-ui/core';
import { SeriesPaneHeader } from './SeriesPaneHeader';
import { DataSets, Normalization, Point, TableRow, TimeSeries } from '../types';
import { getGlobalCases, getGlobalDeaths, getUsCases, getUsDeaths } from '../data-mappers';
import { SevenDayAverageNormalizer } from '../dataset/DatasetView';

const LineChart = React.lazy(() => import('../line-chart/LineChart'));
const CalendarChart = React.lazy(() => import('../calendar-chart/CalendarChart'));

export const SeriesPanel = ({
  normalized,
  dataset,
  region,
  row,
}: {
  normalized: Normalization;
  dataset: DataSets;
  region: string;
  row: TableRow;
}) => {
  const [ds, setDs] = React.useState<TimeSeries | undefined>();
  const [cs, setCs] = React.useState<TimeSeries | undefined>();
  const { population, gdp } = row;
  React.useEffect(() => {
    let csFunc;
    let dsFunc;

    if (dataset === 'global') {
      dsFunc = getGlobalDeaths;
      csFunc = getGlobalCases;
    } else {
      dsFunc = getUsDeaths;
      csFunc = getUsCases;
    }

    csFunc().then((data) => {
      let d = data[region];
      let nor = new SevenDayAverageNormalizer();
      let pp = d.points;

      if (normalized === 'pop') {
        let points = pp.map((point) => {
          return {
            ...point,
            value: Math.round((point.value / population) * 1000000),
          };
        });
        d = { ...d, points };
      } else if (normalized === 'gdp') {
        let points: Point[];
        if (gdp !== undefined) {
          points = pp.map((point) => {
            return { ...point, value: Math.round(point.value * gdp) };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      } else if (normalized === 'gdp+pop') {
        let points: Point[];
        if (gdp !== undefined) {
          points = pp.map((point) => {
            return {
              ...point,
              value: Math.round(((point.value * gdp) / population) * 1000000),
            };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      }
      pp = d.points.map((p) => nor.calc(p));
      d = { ...d, points: pp };
      setCs(d);
      //console.warn(d);
    });

    dsFunc().then((data) => {
      let d = data[region];
      let nor = new SevenDayAverageNormalizer();
      let pp = d.points;
      if (normalized === 'pop') {
        let points = pp.map((point) => {
          return {
            ...point,
            value: Math.round((point.value / population) * 1000000),
          };
        });
        d = { ...d, points };
      } else if (normalized === 'gdp') {
        let points: Point[];
        if (gdp !== undefined) {
          points = pp.map((point) => {
            return { ...point, value: Math.round(point.value * gdp) };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      } else if (normalized === 'gdp+pop') {
        let points: Point[];
        if (gdp !== undefined) {
          points = pp.map((point) => {
            return {
              ...point,
              value: Math.round(((point.value * gdp) / population) * 1000000),
            };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      }
      pp = d.points.map((p) => nor.calc(p));
      d = { ...d, points: pp };
      setDs(d);
      //console.warn(d);
    });
  }, [setDs, setCs, dataset, normalized, region, population, gdp]);
  return (
    <Paper>
      <SeriesPaneHeader>New deaths and cases (7-day Average)</SeriesPaneHeader>
      <LineChart
        data={cs && ds ? [cs, ds] : cs ? [cs] : ds ? [ds] : []}
        leftAxisLabel='change'
        marginTop={10}
        dataKey='label'
      />
      <SeriesPaneHeader>New cases (7-day Average)</SeriesPaneHeader>
      {cs && <CalendarChart data={cs} />}
      <SeriesPaneHeader>New deaths (7-day Average)</SeriesPaneHeader>
      {ds && <CalendarChart data={ds} />}
    </Paper>
  );
};
