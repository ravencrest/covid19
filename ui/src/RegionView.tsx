import React from 'react';
import {
  Divider,
  FormControlLabel,
  CircularProgress,
  Switch,
} from '@material-ui/core';
import { TableRow, DataSets, TimeSeries } from './types';
import RegionPane from './table/RegionPane';
import { useParams } from 'react-router-dom';
import { useImmer } from 'use-immer';

const InfoMenuBar = React.lazy(() => import('./info-menubar/InfoMenuBar'));

const getUsIndex = (it: TableRow) => it.region === 'United States';
const getMdIndex = (it: TableRow) => it.region === 'Maryland';
const getNormalizedSeries = (row: TableRow) => row.changeNormalizedSeries;
const getSeries = (row: TableRow) => row.changeSeries;

type Props = {
  dataset: DataSets;
  rows: TableRow[];
  normalized: boolean;
  lastUpdated: Date | undefined;
  onNormalizedChange: (normalized: boolean, region: string) => void;
};

export default function RegionView({
  dataset,
  rows,
  normalized,
  lastUpdated,
  onNormalizedChange,
}: Props) {
  const [state, setState] = useImmer<{
    series?: TimeSeries[];
    filteredRows?: TableRow[];
  }>({});
  const { filteredRows } = state;

  const routeParams = useParams() as { region: string; dataset: string };
  const region = routeParams.region;

  React.useEffect(() => {
    const global = dataset === 'global';

    const indexToSlice = global ? getUsIndex : getMdIndex;
    const changeMapper = normalized ? getNormalizedSeries : getSeries;
    const indexOfMd = rows?.findIndex(indexToSlice) ?? 0;

    const filteredRows = rows?.filter(
      (row) => row.region.toLowerCase() === routeParams.region.toLowerCase()
    );

    const newSeries = filteredRows
      .map(changeMapper)
      .filter((s) => s != null)
      .slice(0, Math.min(indexOfMd + 1, rows?.length)) as TimeSeries[];
    setState((draft) => {
      draft.series = newSeries;
      draft.filteredRows = filteredRows;
    });
  }, [rows, normalized, dataset, setState, routeParams.region]);

  return (
    <div style={{ maxWidth: 1048, margin: 'auto' }}>
      <React.Suspense fallback={<CircularProgress />}>
        <InfoMenuBar
          lastUpdated={lastUpdated}
          normalized={normalized}
          dataset={dataset}
          region={region}
        >
          <FormControlLabel
            control={
              <Switch
                checked={normalized}
                onChange={(event, value) => {
                  event.stopPropagation();
                  onNormalizedChange(value, region);
                }}
                name='normalized'
              />
            }
            label='Normalized'
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
