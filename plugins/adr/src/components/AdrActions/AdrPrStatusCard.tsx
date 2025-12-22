import React from 'react';
import {
  makeStyles,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Link,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  OpenInNew,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  MergeType,
} from '@material-ui/icons';
import { AdrPullRequest } from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  prNumber: {
    fontWeight: 500,
  },
  statusChip: {
    marginLeft: theme.spacing(1),
  },
  open: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  closed: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  merged: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  },
  draft: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  icon: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
}));

interface AdrPrStatusCardProps {
  pr: AdrPullRequest;
}

export const AdrPrStatusCard = ({ pr }: AdrPrStatusCardProps) => {
  const classes = useStyles();

  const getStatusIcon = () => {
    if (pr.merged) return <MergeType className={classes.icon} />;
    if (pr.state === 'closed') return <Cancel className={classes.icon} />;
    if (pr.state === 'open') return <HourglassEmpty className={classes.icon} />;
    return <CheckCircle className={classes.icon} />;
  };

  const getStatusClass = () => {
    if (pr.merged) return classes.merged;
    if (pr.state === 'closed') return classes.closed;
    return classes.open;
  };

  const getStatusLabel = () => {
    if (pr.merged) return 'Merged';
    if (pr.state === 'closed') return 'Closed';
    return 'Open';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent>
        <Box className={classes.header}>
          <Box className={classes.title}>
            {getStatusIcon()}
            <Link
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.prNumber}
            >
              #{pr.number}
            </Link>
            <Typography variant="body1">{pr.title}</Typography>
            <Chip
              size="small"
              label={getStatusLabel()}
              className={`${classes.statusChip} ${getStatusClass()}`}
            />
          </Box>
          <Tooltip title="Open in GitHub">
            <IconButton
              size="small"
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box className={classes.meta}>
          <span>by {pr.author}</span>
          <span>•</span>
          <span>Created {formatDate(pr.createdAt)}</span>
          {pr.merged && pr.mergedAt && (
            <>
              <span>•</span>
              <span>Merged {formatDate(pr.mergedAt)}</span>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
