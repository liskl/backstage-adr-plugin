import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import CancelIcon from '@material-ui/icons/Cancel';
import ArchiveIcon from '@material-ui/icons/Archive';
import { AdrStats, AdrStatus } from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  card: {
    height: '100%',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  icon: {
    fontSize: 48,
  },
  accepted: {
    color: theme.palette.success.main,
  },
  proposed: {
    color: theme.palette.warning.main,
  },
  rejected: {
    color: theme.palette.error.main,
  },
  deprecated: {
    color: theme.palette.grey[500],
  },
  draft: {
    color: theme.palette.info.main,
  },
  superseded: {
    color: theme.palette.grey[400],
  },
  stats: {
    flex: 1,
  },
  count: {
    fontSize: '2rem',
    fontWeight: 'bold',
  },
}));

interface AdrStatsCardsProps {
  stats?: AdrStats;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  loading?: boolean;
}

const StatCard = ({ title, count, icon, colorClass, loading }: StatCardProps) => {
  const classes = useStyles();

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Skeleton variant="circle" width={48} height={48} />
          <div className={classes.stats}>
            <Skeleton width={60} />
            <Skeleton width={100} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardContent className={classes.cardContent}>
        <div className={colorClass}>{icon}</div>
        <div className={classes.stats}>
          <Typography className={classes.count}>{count}</Typography>
          <Typography color="textSecondary">{title}</Typography>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Stats cards showing ADR counts by status
 */
export const AdrStatsCards = ({ stats, loading }: AdrStatsCardsProps) => {
  const classes = useStyles();

  const statusConfigs: Array<{
    status: AdrStatus;
    title: string;
    icon: React.ReactNode;
    colorClass: string;
  }> = [
    {
      status: 'accepted',
      title: 'Accepted',
      icon: <CheckCircleIcon className={classes.icon} />,
      colorClass: classes.accepted,
    },
    {
      status: 'proposed',
      title: 'Proposed',
      icon: <HourglassEmptyIcon className={classes.icon} />,
      colorClass: classes.proposed,
    },
    {
      status: 'rejected',
      title: 'Rejected',
      icon: <CancelIcon className={classes.icon} />,
      colorClass: classes.rejected,
    },
    {
      status: 'deprecated',
      title: 'Deprecated',
      icon: <ArchiveIcon className={classes.icon} />,
      colorClass: classes.deprecated,
    },
  ];

  return (
    <Grid container spacing={2}>
      {statusConfigs.map(config => (
        <Grid item xs={12} sm={6} md={3} key={config.status}>
          <StatCard
            title={config.title}
            count={stats?.byStatus?.[config.status] || 0}
            icon={config.icon}
            colorClass={config.colorClass}
            loading={loading}
          />
        </Grid>
      ))}
    </Grid>
  );
};
