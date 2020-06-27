export type DataSets = 'global' | 'us';

export type Normalization = 'gdp' | 'pop' | 'gdp+pop' | 'none' | 'tests' | 'tests+gdp' | 'tests+pop' | 'tests+gdp+pop';

export type TableRow = {
  region: string;
  code: string;
  cases?: number;
  tests?: number;
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

export type RawResults = {
  lastUpdated: string;
  rows: Array<TableRow>;
};

export type Results = {
  lastUpdated: Date;
  rows: Array<TableRow>;
};

export function assertNever(value: never): never {
  throw new Error(`assertNever received value: ${value}`);
}
