export type DataSets = 'global' | 'us';

export type Normalization = 'gdp' | 'pop' | 'gdp+pop' | 'none';

export type TableRow = {
  region: string;
  code: string;
  cases?: number;
  casesNormalized?: number;
  change?: number;
  weeklyChange?: number;
  deaths?: number;
  recovered?: number;
  population: number;
  gdp?: number;
};

export type Point = {
  date: string;
  value: number;
};

export type TimeSeries = {
  region: string;
  label: string;
  points: Point[];
};

export type Results = {
  lastUpdated: string;
  rows: Array<TableRow>;
  graph: TimeSeries[];
};
