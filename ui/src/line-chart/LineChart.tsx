import React from 'react';
import { LegendProps } from '@nivo/legends';
import { Datum, ResponsiveLine, Serie } from '@nivo/line';
import { Point, TimeSeries } from '../types';
import { LineChartTooltip } from './LineChartTooltip';

const pointToDatum = (point: Point): Datum => {
  return {
    x: point.date,
    y: point.value,
  };
};

const seriesToData = (data: TimeSeries): Serie => {
  const { region } = data;
  return { id: region, data: data.points.map(pointToDatum) };
};

type Props = {
  data: TimeSeries[] | TimeSeries | undefined;
  leftAxisLabel: string;
  height?: string;
  hideLegend?: boolean;
  marginTop?: number;
  marginRight?: number;
};

export default React.memo(
  ({
    data,
    leftAxisLabel,
    height = '15em',
    hideLegend,
    marginTop = 50,
    marginRight = 110,
  }: Props) => {
    const mappedData = React.useMemo(() => {
      if (!data) {
        return [];
      }
      return Array.isArray(data)
        ? data.map(seriesToData)
        : [seriesToData(data)];
    }, [data]);
    const isSmallScreen = document.documentElement.clientWidth < 600;
    const legends: LegendProps[] | undefined =
      hideLegend || isSmallScreen
        ? undefined
        : [
            {
              anchor: isSmallScreen ? 'bottom' : 'bottom-right',
              direction: isSmallScreen ? 'row' : 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ];
    return (
      <div style={{ height, maxWidth: '90vw', width: '100%' }}>
        <ResponsiveLine
          xScale={{
            type: 'time',
            format: '%Y-%m-%d',
            precision: 'day',
          }}
          data={mappedData}
          margin={{
            top: marginTop,
            right: isSmallScreen ? 10 : marginRight,
            bottom: 50,
            left: 60,
          }}
          enablePoints={false}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false,
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            orient: 'bottom',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 60,
            legendOffset: 45,
            legendPosition: 'middle',
            format: '%b %d',
          }}
          tooltip={LineChartTooltip}
          axisLeft={{
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: leftAxisLabel,
            legendOffset: -40,
            legendPosition: 'middle',
          }}
          colors={{ scheme: 'category10' }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabel='y'
          xFormat='time:%Y-%m-%d'
          useMesh={true}
          legends={legends}
        />
      </div>
    );
  }
);
