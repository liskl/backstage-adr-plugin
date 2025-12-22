import React from 'react';
import { Link, Table, TableColumn, WarningPanel } from '@backstage/core-components';
import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { AdrSummary, AdrStatus } from '@backstage-community/plugin-adr-common';
import { AdrStatusBadge } from './AdrStatusBadge';

const useStyles = makeStyles(theme => ({
  searchBar: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    maxWidth: 400,
  },
  statusFilter: {
    minWidth: 150,
  },
  tags: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
  },
  tag: {
    height: 20,
    fontSize: '0.75rem',
  },
  compactList: {
    '& .MuiTableCell-root': {
      padding: theme.spacing(1),
    },
  },
  adrNumber: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1),
  },
}));

interface AdrListProps {
  adrs: AdrSummary[];
  totalCount?: number;
  loading?: boolean;
  error?: Error;
  compact?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: string[];
  onStatusFilterChange?: (statuses: string[]) => void;
}

const STATUS_OPTIONS: AdrStatus[] = [
  'draft',
  'proposed',
  'accepted',
  'rejected',
  'deprecated',
  'superseded',
];

/**
 * List component for displaying ADRs
 */
export const AdrList = ({
  adrs,
  totalCount,
  loading,
  error,
  compact = false,
  page = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  searchQuery = '',
  onSearchChange,
  statusFilter = [],
  onStatusFilterChange,
}: AdrListProps) => {
  const classes = useStyles();

  if (error) {
    return (
      <WarningPanel title="Failed to load ADRs" message={error.message} />
    );
  }

  const columns: TableColumn<AdrSummary>[] = [
    {
      title: 'Title',
      field: 'title',
      render: (row) => (
        <Link to={`/adr/${encodeURIComponent(row.id)}`}>
          <Typography variant="body2">
            <span className={classes.adrNumber}>
              {String(row.number).padStart(4, '0')}
            </span>
            {row.title}
          </Typography>
        </Link>
      ),
    },
    {
      title: 'Status',
      field: 'status',
      width: '120px',
      render: (row) => <AdrStatusBadge status={row.status} />,
    },
  ];

  if (!compact) {
    columns.push(
      {
        title: 'Tags',
        field: 'tags',
        render: (row) => (
          <div className={classes.tags}>
            {row.tags.slice(0, 3).map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                className={classes.tag}
                variant="outlined"
              />
            ))}
            {row.tags.length > 3 && (
              <Chip
                label={`+${row.tags.length - 3}`}
                size="small"
                className={classes.tag}
                variant="outlined"
              />
            )}
          </div>
        ),
      },
      {
        title: 'Updated',
        field: 'updatedAt',
        width: '150px',
        render: (row) => (
          <Typography variant="body2" color="textSecondary">
            {new Date(row.updatedAt).toLocaleDateString()}
          </Typography>
        ),
      },
    );
  }

  const showFilters = onSearchChange || onStatusFilterChange;

  return (
    <Box className={compact ? classes.compactList : undefined}>
      {showFilters && (
        <Box className={classes.searchBar}>
          {onSearchChange && (
            <TextField
              className={classes.searchField}
              placeholder="Search ADRs..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
          {onStatusFilterChange && (
            <Select
              className={classes.statusFilter}
              multiple
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value as string[])}
              displayEmpty
              variant="outlined"
              renderValue={selected => {
                if ((selected as string[]).length === 0) {
                  return <em>All Statuses</em>;
                }
                return (selected as string[]).join(', ');
              }}
            >
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      )}

      <Table
        data={adrs}
        columns={columns}
        isLoading={loading}
        options={{
          padding: compact ? 'dense' : 'default',
          pageSize: compact ? 5 : pageSize,
          pageSizeOptions: compact ? [5] : [10, 20, 50],
          paging: !compact,
          search: false,
          toolbar: false,
          emptyRowsWhenPaging: false,
        }}
        page={page}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onPageSizeChange}
      />
    </Box>
  );
};
