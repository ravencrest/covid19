import React from 'react';
import { ResponsiveCalendar, CalendarDatum as Datum } from '@nivo/calendar';
import { TimeSeries, Point } from '../types';
import { setDayOfYear } from 'date-fns';

type Props = {
  data: TimeSeries;
  height?: string;
};

const pointToDatum = (point: Point): Datum => {
  return {
    day: point.date,
    value: point.value,
  };
};

const CalendarChart = React.memo(({ data, height = '15em' }: Props) => {
  const from = setDayOfYear(new Date(), 1);
  const points = data.points;
  const pointsLength = points && points.length;
  const to = pointsLength ? points[points.length - 1].date : setDayOfYear(new Date(), 365);

  return (
    <div style={{ height: '15em', maxWidth: '90vw', width: '100%' }}>
      <ResponsiveCalendar
        data={data.points.map(pointToDatum)}
        from={from}
        to={to}
        emptyColor='#eeeeee'
        colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        yearSpacing={40}
        monthBorderColor='#ffffff'
        dayBorderWidth={2}
        dayBorderColor='#ffffff'
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'row',
            translateY: 36,
            itemCount: 4,
            itemWidth: 42,
            itemHeight: 36,
            itemsSpacing: 14,
            itemDirection: 'right-to-left',
          },
        ]}
      />
    </div>
  );
});

export default CalendarChart;
