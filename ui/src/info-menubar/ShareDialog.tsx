import {
  Dialog,
  DialogContent,
  DialogContentText,
  TextField,
} from '@material-ui/core';
import React from 'react';
import { DialogTitle } from '../dialog/DialogTitle';

export const ShareDialog = ({
  onClose,
  open,
  href,
}: {
  onClose: () => void;
  open: boolean;
  href: string;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <Dialog
      onClose={onClose}
      aria-labelledby='simple-dialog-title'
      open={open}
      onRendered={() => {
        ref.current?.select();
      }}
    >
      <DialogTitle onClose={onClose}>Direct Link</DialogTitle>
      <DialogContent style={{ width: `${href.length / 1.5}em` }}>
        <DialogContentText>
          <TextField
            value={href}
            inputRef={ref}
            InputProps={{ readOnly: true }}
            fullWidth
            variant='outlined'
          />
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};
