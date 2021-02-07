import React from 'react';
import { Typography } from '@material-ui/core';

export const SeriesPaneHeader = ({ children }: { children: React.ReactChild }) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <Typography component='h3'>{children}</Typography>
  </div>
);
