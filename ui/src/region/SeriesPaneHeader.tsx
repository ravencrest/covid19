import { ReactChild } from 'react';
import { Typography } from '@material-ui/core';

export const SeriesPaneHeader = ({ children }: { children: ReactChild }) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <Typography component='h3'>{children}</Typography>
  </div>
);
