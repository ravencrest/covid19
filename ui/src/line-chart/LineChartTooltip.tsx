import { PointTooltipProps } from '@nivo/line';
import { BasicTooltip } from '@nivo/tooltip';
import React from 'react';

export const LineChartTooltip = ({ point }: PointTooltipProps) => {
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
