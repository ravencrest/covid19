import React from 'react';
import {
  Divider,
  FormControlLabel,
  CircularProgress,
  Switch,
  Button,
} from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import { TableRow, DataSets, TimeSeries, Normalization } from './types';
import RegionPane from './table/RegionPane';
import { useParams } from 'react-router-dom';
import { useImmer } from 'use-immer';
import { setLocation } from './GlobalContext';
import { changeMapper, deathMapper } from './App';

const InfoMenuBar = React.lazy(() => import('./info-menubar/InfoMenuBar'));

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
  onNormalizedChange,
}: Props) {
  const [state, setState] = useImmer<{
    changeSeries?: TimeSeries;
    deathSeries?: TimeSeries;
    filteredRows?: TableRow[];
  }>({});
  const { filteredRows } = state;

  const routeParams = useParams() as { region: string; dataset: string };
  const region = routeParams.region.toLowerCase();

  React.useEffect(() => {
    changeMapper(dataset)().then((data) => {
      const series = data[region];
      setState((draft) => {
        draft.changeSeries = series;
      });
    });

    deathMapper(dataset)().then((data) => {
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
        <InfoMenuBar
          lastUpdated={lastUpdated}
          normalized={normalized}
          dataset={dataset}
          region={region}
        >
          <FormControlLabel
            control={
              <Switch
                checked={normalized === 'gdp' || normalized === 'gdp+pop'}
                onChange={(event, value) => {
                  event.stopPropagation();
                  const off =
                    normalized === 'gdp+pop' || normalized === 'pop'
                      ? 'pop'
                      : 'none';
                  const on = normalized === 'pop' ? 'gdp+pop' : 'gdp';
                  onNormalizedChange(value ? on : off, region);
                }}
                name='normalized'
              />
            }
            label='Norm GDP'
          />
          <FormControlLabel
            control={
              <Switch
                checked={normalized === 'pop' || normalized === 'gdp+pop'}
                onChange={(event, value) => {
                  event.stopPropagation();
                  const off =
                    normalized === 'gdp+pop' || normalized === 'gdp'
                      ? 'gdp'
                      : 'none';
                  const on = normalized === 'gdp' ? 'gdp+pop' : 'pop';
                  onNormalizedChange(value ? on : off, region);
                }}
                name='normalized'
              />
            }
            label='Norm Pop'
          />
        </InfoMenuBar>
        <Divider />
        {filteredRows && (
          <RegionPane
            data={filteredRows}
            normalized={normalized}
            dataset={dataset}
          />
        )}
        {!filteredRows && <CircularProgress />}
      </React.Suspense>
    </div>
  );
}
