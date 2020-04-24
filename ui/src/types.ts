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
};

export type Point = {
  country: string;
  date: string;
  value: number;
};

export type TimeSeries = {
  country: string;
  points: Point[];
};

export type Results = {
  lastUpdated: string;
  rows: Array<TableRow>;
  graph: TimeSeries[];
};
