import React from 'react';
import {
  Dialog,
  DialogTitle as MuiDialogTitle,
  IconButton,
  DialogContent,
  DialogContentText,
  Typography,
  Link as MuiLink,
  Chip,
  makeStyles,
  Button,
} from '@material-ui/core';
import { Help, Close, GitHub, Share } from '@material-ui/icons';
import { githubUrl } from '../constants';
import { formatRelative as format } from 'date-fns';
import { DataSets } from '../types';

const useStyles = makeStyles((theme) => ({
  root: {
    marginLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

const Link = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactChild;
}) => (
  <MuiLink href={href} target='_blank' rel='noopener noreferrer'>
    {children}
  </MuiLink>
);

const DialogTitle = (props: {
  onClose: () => void;
  children: React.ReactChild;
}) => {
  const { children, onClose } = props;
  const styles = useStyles();
  return (
    <MuiDialogTitle disableTypography>
      <Typography variant='h6'>{children}</Typography>
      {onClose ? (
        <IconButton
          aria-label='close'
          className={styles.closeButton}
          onClick={onClose}
        >
          <Close />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
};

const now = new Date();

type Props = {
  lastUpdated: Date | undefined;
  dataset: DataSets;
  normalized: boolean;
  children: React.ReactNode;
  region?: string;
};

export const getDirectLink = (
  dataset: DataSets,
  normalized: boolean,
  region?: string
) => {
  return `${window.location.protocol}//${window.location.host}/${dataset}${
    region ? `/${region}` : ''
  }?norm=${normalized}`;
};

export default ({
  lastUpdated,
  children,
  normalized,
  dataset,
  region,
}: Props) => {
  const [open, setOpen] = React.useState<'link' | 'info' | undefined>(
    undefined
  );
  const styles = useStyles();
  const onClose = () => setOpen(undefined);
  const onOpenLink = () => setOpen('link');
  const onOpenInfo = () => setOpen('info');

  return (
    <div className={styles.bar}>
      {children}
      <Chip
        label={lastUpdated ? `Last updated ${format(lastUpdated, now)}` : '...'}
        deleteIcon={<Help />}
        onDelete={onOpenInfo}
        onClick={onOpenInfo}
      />
      <Link href={githubUrl}>
        <IconButton>
          <GitHub />
        </IconButton>
      </Link>
      <Button
        endIcon={<Share />}
        color='primary'
        style={{ textTransform: 'unset' }}
        onClick={onOpenLink}
      >
        Share
      </Button>
      <Dialog
        onClose={onClose}
        aria-labelledby='simple-dialog-title'
        open={open === 'link'}
      >
        <DialogTitle onClose={onClose}>Direct Link</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getDirectLink(dataset, normalized, region)}
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <Dialog
        onClose={onClose}
        aria-labelledby='simple-dialog-title'
        open={open === 'info'}
      >
        <DialogTitle onClose={onClose}>About</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Licensed under the{' '}
            <Link href='https://www.apache.org/licenses/LICENSE-2.0.html'>
              Apache 2.0 License
            </Link>
            <br />
            Source can be found at: <Link href={githubUrl}>GitHub</Link>
            <br />
            COVID-19 data is taken from:{' '}
            <Link href='https://github.com/CSSEGISandData/COVID-19'>
              CSSE at Johns Hopkins University
            </Link>
            <br />
            Population data is taken from:{' '}
            <Link href='https://www.worldometers.info/world-population/population-by-country/'>
              Worldometer
            </Link>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
};
