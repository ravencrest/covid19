import React from 'react';
import { Divider, CircularProgress, Button } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import { TableRow, DataSets, TimeSeries, Normalization } from '../types';
import { useParams } from 'react-router-dom';
import { useImmer } from 'use-immer';
import { setLocation } from '../GlobalContext';
import TablePane from '../table/TablePane';
import { NormalizeSwitch } from '../dataset/NormalizeSwitch';
import { getCasesTimeSeries, getDeathsTimeSeries } from '../data-mappers';
const InfoMenuBar = React.lazy(() => import('../info-menubar/InfoMenuBar'));

type Props = {
  dataset: DataSets;
  rows: TableRow[];
  normalized: Normalization;
  lastUpdated: Date | undefined;
  onNormalizedChange: (normalized: Normalization, region: string) => void;
};

export default function RegionView({
  dataset,
  rows,
  normalized,
  lastUpdated,
  onNormalizedChange: handleNormalizationChange,
}: Props) {
  const [state, setState] = useImmer<{
    changeSeries?: TimeSeries;
    deathSeries?: TimeSeries;
    filteredRows?: TableRow[];
  }>({});
  const { filteredRows } = state;
  const routeParams = useParams() as { region: string; dataset: string };
  const region = routeParams.region.toLowerCase();

  const onNormalizedChange = React.useCallback(
    (normalization: Normalization) => {
      handleNormalizationChange(normalization, region);
    },
    [handleNormalizationChange, region]
  );

  React.useEffect(() => {
    getCasesTimeSeries(dataset)().then((data) => {
      const series = data[region];
      setState((draft) => {
        draft.changeSeries = series;
      });
    });

    getDeathsTimeSeries(dataset)().then((data) => {
      const series = data[region];
      setState((draft) => {
        draft.deathSeries = series;
      });
    });

    const filteredRows = rows?.filter((row) => {
      const rowRegion = row.region.toLowerCase();
      const code = row.code.toLowerCase();
      return code === region || rowRegion === region;
    });
    setState((draft) => {
      draft.filteredRows = filteredRows;
    });
  }, [rows, normalized, dataset, setState, region]);

  return (
    <div style={{ width: 1048, maxWidth: '95vw', margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <Button
          fullWidth
          color='primary'
          variant='contained'
          startIcon={<ArrowBack />}
          onClick={() => {
            setLocation(dataset, normalized);
          }}
        >
          Back to all results
        </Button>
        <InfoMenuBar lastUpdated={lastUpdated} normalized={normalized} dataset={dataset} region={region}>
          <NormalizeSwitch
            label='Norm GDP'
            norm='gdp'
            alt='pop'
            onChange={onNormalizedChange}
            currentValue={normalized}
          />
          <NormalizeSwitch
            label='Norm Pop'
            norm='pop'
            alt='gdp'
            onChange={onNormalizedChange}
            currentValue={normalized}
          />
        </InfoMenuBar>
        <Divider />
        {filteredRows && <TablePane embedded data={filteredRows} normalized={normalized} dataset={dataset} />}
        {!filteredRows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
}
