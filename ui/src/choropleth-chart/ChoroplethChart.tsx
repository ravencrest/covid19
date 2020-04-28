import React from 'react';
import { ChoroplethBoundFeature, ResponsiveChoropleth } from '@nivo/geo';
import { TableRow } from '../types';
import { CircularProgress } from '@material-ui/core';

type Props = {
  data: TableRow[];
  accessor: (row: TableRow) => number;
  min: number;
  max: number;
};

export default ({ data, accessor, min, max }: Props) => {
  const results = React.useMemo(() => {
    return data.map((row) => ({ id: row.code, value: accessor(row) }));
  }, [data, accessor]);

  const [features, setFeatures] = React.useState<ChoroplethBoundFeature[]>([]);

  React.useEffect(() => {
    import('../world_countries.json').then((f) => {
      setFeatures(f.features as any);
    });
  }, []);

  return (
    <div
      style={{
        height: '30em',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      {!features.length && (
        <>
          Loading map features...
          <CircularProgress />
        </>
      )}
      {!!features.length && (
        <ResponsiveChoropleth
          projectionScale={130}
          data={results}
          features={features}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          colors='reds'
          domain={[min, max]}
          unknownColor='grey'
          label='properties.name'
          projectionType='equalEarth'
          enableGraticule
          graticuleLineColor='#dddddd'
          borderWidth={0.5}
          borderColor='#152538'
        />
      )}
    </div>
  );
};
