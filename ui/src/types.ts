export type DataSets = 'global' | 'us';

export type TableRow = {
  region: string;
  code?: string;
  cases: number;
  casesNormalized: number;
  change?: number;
  weeklyChange?: number;
  deaths: number;
  deathsNormalized: number;
  recovered?: number;
  recoveredNormalized?: number;
  population: number;
  changeNormalizedSeries?: TimeSeries;
  changeSeries?: TimeSeries;
};

export type Point = {
  date: string;
  value: number;
};

export type TimeSeries = {
  region: string;
  points: Point[];
};

export type Results = {
  lastUpdated: string;
  rows: Array<TableRow>;
  graph: TimeSeries[];
};
