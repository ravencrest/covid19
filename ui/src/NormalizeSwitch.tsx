import { Normalization } from './types';
import { FormControlLabel, Switch } from '@material-ui/core';
import React from 'react';

export const NormalizeSwitch = ({
  norm,
  alt,
  label,
  onChange,
  currentValue,
}: {
  norm: Normalization;
  alt: Normalization;
  label: string;
  onChange: (normalization: Normalization) => void;
  currentValue: Normalization;
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={currentValue === norm || currentValue === 'gdp+pop'}
          onChange={(event, value) => {
            event.stopPropagation();
            const off = currentValue === 'gdp+pop' || currentValue === alt ? alt : 'none';
            const on = currentValue === alt ? 'gdp+pop' : norm;
            onChange(value ? on : off);
          }}
          name='normalized'
        />
      }
      label={label}
    />
  );
};
