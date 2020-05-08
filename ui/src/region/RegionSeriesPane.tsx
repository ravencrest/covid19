import React from 'react';
import { Paper } from '@material-ui/core';
import { SeriesPaneHeader } from './SeriesPaneHeader';
import { DataSets, Normalization, Point, TableRow, TimeSeries } from '../types';
import { getGlobalCases, getGlobalDeaths, getUsCases, getUsDeaths } from '../data-mappers';

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
      if (normalized === 'pop') {
        let points = d.points.map((point) => {
          return {
            ...point,
            value: Math.round((point.value / population) * 1000000),
          };
        });
        d = { ...d, points };
      } else if (normalized === 'gdp') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
            return { ...point, value: Math.round(point.value * gdp) };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      } else if (normalized === 'gdp+pop') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
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
      setCs(d);
    });

    dsFunc().then((data) => {
      let d = data[region];
      if (normalized === 'pop') {
        let points = d.points.map((point) => {
          return {
            ...point,
            value: Math.round((point.value / population) * 1000000),
          };
        });
        d = { ...d, points };
      } else if (normalized === 'gdp') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
            return { ...point, value: Math.round(point.value * gdp) };
          });
        } else {
          points = [];
        }
        d = { ...d, points };
      } else if (normalized === 'gdp+pop') {
        let points: Point[];
        if (gdp !== undefined) {
          points = d.points.map((point) => {
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
      setDs(d);
    });
  }, [setDs, setCs, dataset, normalized, region, population, gdp]);

  const data = React.useMemo(() => {
    const d: Array<TimeSeries> = [];
    if (ds) {
      d.push(ds);
    }
    if (cs) {
      d.push(cs);
    }
    return d;
  }, [ds, cs]);
  return (
    <Paper>
      <SeriesPaneHeader>New deaths and cases</SeriesPaneHeader>
      <LineChart data={data} leftAxisLabel='change' marginTop={10} dataKey='label' />
      <SeriesPaneHeader>New cases</SeriesPaneHeader>
      {cs && <CalendarChart data={cs} />}
      <SeriesPaneHeader>New deaths</SeriesPaneHeader>
      {ds && <CalendarChart data={ds} />}
    </Paper>
  );
};
