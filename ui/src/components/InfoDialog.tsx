import React from "react";
import {
  Dialog,
  DialogTitle as MuiDialogTitle,
  IconButton,
  DialogContent,
  DialogContentText,
  Typography,
  withStyles,
  DialogTitleProps,
  createStyles,
  Theme
} from '@material-ui/core';
import { Help, Close } from '@material-ui/icons'

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });

const Link = ({href, children}: { href: string, children: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);

const DialogTitle = withStyles(styles)((props: DialogTitleProps & { onClose: () => void }) => {
  const {children, classes, onClose, ...other} = props;
  return (
    <MuiDialogTitle disableTypography {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={(classes as any).closeButton} onClick={onClose}>
          <Close />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

export const InfoDialog = () => {
  const [open, setOpen] = React.useState(false);
  const onClose = () => setOpen(false);
  const onOpen = () => setOpen(true);
  return (
    <>
      <IconButton onClick={onOpen}><Help /></IconButton>
      <Dialog onClose={onClose} aria-labelledby="simple-dialog-title" open={open}>
        <DialogTitle onClose={onClose}>About</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Licensed under the <Link href='https://www.apache.org/licenses/LICENSE-2.0.html'>Apache 2.0 License</Link><br />
            Source can be found at: <Link href='https://github.com/ravencrest/covid19'>GitHub</Link><br />
            COVID-19 data is taken from: <Link href='https://github.com/CSSEGISandData/COVID-19'>CSSE at Johns Hopkins University</Link><br />
            Population data is taken from: <Link href='https://www.worldometers.info/world-population/population-by-country/'>Worldometer</Link>
          </DialogContentText>
        </DialogContent>
      </Dialog></>);
};