import React from 'react';
import { useCellStyles } from './SeriesTableRow';
import { TableCell as MuiTableCell } from '@material-ui/core';
import clsx from 'clsx';
import stylesM from './Table.module.css';

type Props = { responsive?: boolean } & Pick<
  React.TdHTMLAttributes<HTMLTableDataCellElement>,
  'id' | 'children' | 'colSpan' | 'className'
>;

export const TableCell = ({ children, responsive, className, ...rest }: Props) => {
  const styles = useCellStyles();
  return (
    <MuiTableCell {...rest} className={clsx(styles.cell, responsive ? stylesM.containerHidden : undefined, className)}>
      {children}
    </MuiTableCell>
  );
};
