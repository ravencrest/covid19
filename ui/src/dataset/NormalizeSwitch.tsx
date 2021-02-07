import { Normalization } from '../types';
import { FormControlLabel, Switch, Tooltip } from '@material-ui/core';

export const NormalizeSwitch = ({
  norm,
  label,
  onChange,
  currentValue,
  disabled,
}: {
  norm: Normalization;
  label: string;
  onChange: (normalization: Normalization[]) => void;
  currentValue: Normalization[];
  disabled?: boolean;
}) => {
  const checked = currentValue.includes(norm);
  return (
    <Tooltip title={`Normalize by ${label}`}>
      <FormControlLabel
        disabled={disabled}
        control={
          <Switch
            checked={checked}
            onChange={(event, value) => {
              event.stopPropagation();
              onChange(checked ? currentValue.filter((it) => it !== norm) : [...currentValue, norm]);
            }}
            name='normalized'
          />
        }
        label={`Norm. ${label}`}
      />
    </Tooltip>
  );
};
