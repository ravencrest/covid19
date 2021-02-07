import { useMemo, useEffect, useState } from 'react';
import { ChoroplethBoundFeature, ResponsiveChoropleth } from '@nivo/geo';
import { TableRow } from '../types';
import { CircularProgress } from '@material-ui/core';

type Props = {
  data: TableRow[];
  accessor: (row: TableRow) => number | undefined;
  min: number;
  max: number;
};

export default ({ data, accessor, min, max }: Props) => {
  const results = useMemo(() => {
    return data.map((row) => ({ id: row.code, value: accessor(row) }));
  }, [data, accessor]);

  const [features, setFeatures] = useState<ChoroplethBoundFeature[]>([]);

  useEffect(() => {
    import('../world_countries.json').then((f) => {
      setFeatures(f.features as any);
    });
  }, []);

  const isSmallScreen = document.documentElement.clientWidth < 600;
  return (
    <div
      style={{
        height: isSmallScreen ? '15em' : '30em',
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
          projectionScale={isSmallScreen ? 60 : 130}
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
