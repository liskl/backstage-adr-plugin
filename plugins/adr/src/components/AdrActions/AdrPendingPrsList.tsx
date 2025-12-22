import React from 'react';
import {
  makeStyles,
  Typography,
  Box,
  CircularProgress,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { AdrPullRequest } from '@backstage-community/plugin-adr-common';
import { AdrPrStatusCard } from './AdrPrStatusCard';

const useStyles = makeStyles(theme => ({
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
}));

interface AdrPendingPrsListProps {
  prs?: AdrPullRequest[];
  loading?: boolean;
  error?: string;
}

export const AdrPendingPrsList = ({
  prs = [],
  loading = false,
  error,
}: AdrPendingPrsListProps) => {
  const classes = useStyles();

  const renderContent = () => {
    if (loading) {
      return (
        <Box className={classes.loadingContainer}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box className={classes.emptyState}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (prs.length === 0) {
      return (
        <Box className={classes.emptyState}>
          <Typography>No pending pull requests</Typography>
          <Typography variant="body2">
            Pull requests for ADR changes will appear here
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {prs.map(pr => (
          <AdrPrStatusCard key={pr.number} pr={pr} />
        ))}
      </Box>
    );
  };

  return (
    <InfoCard title="Pending Pull Requests" noPadding={prs.length > 0}>
      {renderContent()}
    </InfoCard>
  );
};
