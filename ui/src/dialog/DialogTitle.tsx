import { ReactChild } from 'react';
import { DialogTitle as MuiDialogTitle, IconButton, makeStyles, Typography } from '@material-ui/core';
import { Close } from '@material-ui/icons';

export const useStyles = makeStyles((theme) => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

export const DialogTitle = (props: { onClose: () => void; children: ReactChild }) => {
  const { children, onClose } = props;
  const styles = useStyles();
  return (
    <MuiDialogTitle disableTypography>
      <Typography variant='h6'>{children}</Typography>
      {onClose ? (
        <IconButton aria-label='close' className={styles.closeButton} onClick={onClose}>
          <Close />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
};
