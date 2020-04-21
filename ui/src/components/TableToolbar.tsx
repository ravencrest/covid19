import React from 'react'
import clsx from 'clsx'
import { Toolbar, lighten, makeStyles } from '@material-ui/core'
import { GlobalFilter } from './GlobalFilter'
import { InfoDialog } from "./InfoDialog";

const useToolbarStyles = makeStyles(theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
        color: theme.palette.secondary.main,
        backgroundColor: lighten(theme.palette.secondary.light, 0.85),
      }
      : {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark,
      },
  title: {
    flex: '1 1 100%',
  },
}))

type Props = {
  setGlobalFilter: (filter: string | undefined) => void;
  globalFilter: string;
};

export const TableToolbar = (props: Props) => {
  const classes = useToolbarStyles()
  const {
    setGlobalFilter,
    globalFilter,
  } = props
  return (
    <Toolbar
      className={clsx(classes.root)}
    >
      <GlobalFilter
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <InfoDialog />
    </Toolbar>
  )
};