import React from 'react';
import { Chip, makeStyles } from '@material-ui/core';
import { AdrStatus } from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  badge: {
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  draft: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  },
  proposed: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  accepted: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  rejected: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  deprecated: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.getContrastText(theme.palette.grey[400]),
  },
  superseded: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.getContrastText(theme.palette.grey[300]),
  },
}));

interface AdrStatusBadgeProps {
  status: AdrStatus;
  size?: 'small' | 'medium';
}

/**
 * Badge component for displaying ADR status
 */
export const AdrStatusBadge = ({
  status,
  size = 'small',
}: AdrStatusBadgeProps) => {
  const classes = useStyles();

  const statusClass = classes[status] || classes.draft;

  return (
    <Chip
      label={status}
      size={size}
      className={`${classes.badge} ${statusClass}`}
    />
  );
};
