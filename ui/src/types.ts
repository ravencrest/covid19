export type TableRow = {
  region: string;
  cases: number;
  casesNormalized: number;
  change?: number;
  deaths: number;
  deathsNormalized: number;
  recovered: number;
  recoveredNormalized: number;
  population: number;
  changeNormalizedSeries: TimeSeries;
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
