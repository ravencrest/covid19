import React from 'react';
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
  data: TimeSeries[];
  leftAxisLabel: string;
  height?: string;
};

export const LineChart = React.memo(
  ({ data, leftAxisLabel, height = '22em' }: Props) => (
    <div style={{ height }}>
      <ResponsiveLine
        xScale={{
          type: 'time',
          format: '%Y-%m-%d',
          precision: 'day',
        }}
        data={data.map(seriesToData)}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
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
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
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
        ]}
      />
    </div>
  )
);
