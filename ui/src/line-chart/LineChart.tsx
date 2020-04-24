import React from 'react';
import { ResponsiveLine, Datum, Serie, PointTooltipProps } from '@nivo/line';
import { BasicTooltip } from '@nivo/tooltip';
import { TimeSeries, Point } from '../types';

type Props = {
  data: TimeSeries[];
  leftAxisLabel: string;
};

const LinePointTooltip = ({ point }: PointTooltipProps) => {
  return (
    <BasicTooltip
      id={
        <span>
          {point.serieId} x: <strong>{point.data.xFormatted}</strong>, y:{' '}
          <strong>{point.data.yFormatted}</strong>
        </span>
      }
      enableChip={true}
      color={point.serieColor}
    />
  );
};

const pointToDatum = (point: Point): Datum => {
  return {
    x: point.date,
    y: point.value,
    country: point.country,
    id: point.country,
  };
};

const seriesToData = (data: TimeSeries): Serie => {
  return { id: data.country, data: data.points.map(pointToDatum) };
};

export const LineChart = React.memo(({ data, leftAxisLabel }: Props) => (
  <div style={{ height: '22em' }}>
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
      tooltip={LinePointTooltip}
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
));
