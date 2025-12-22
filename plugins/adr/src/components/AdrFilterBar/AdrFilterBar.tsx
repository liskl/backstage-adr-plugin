import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  Box,
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  Collapse,
  Paper,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import FilterListIcon from '@material-ui/icons/FilterList';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import ClearIcon from '@material-ui/icons/Clear';
import { AdrFilters, AdrStatus, SavedFilterPreset } from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  mainRow: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchField: {
    flex: 1,
    minWidth: 200,
    maxWidth: 400,
  },
  filterControl: {
    minWidth: 150,
  },
  expandedFilters: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  filterRow: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  dateField: {
    minWidth: 160,
  },
  presetChip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  presetSection: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  presetLabel: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  activeFiltersSection: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  activeFilterChip: {
    height: 24,
  },
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing(1),
    marginLeft: 'auto',
  },
}));

const STATUS_OPTIONS: AdrStatus[] = [
  'draft',
  'proposed',
  'accepted',
  'rejected',
  'deprecated',
  'superseded',
];

const DEFAULT_PRESETS: SavedFilterPreset[] = [
  {
    id: 'active',
    name: 'Active Decisions',
    filters: { status: ['accepted'] },
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pending',
    name: 'Pending Review',
    filters: { status: ['proposed', 'draft'] },
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'recent',
    name: 'Updated Recently',
    filters: {
      updatedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

interface AdrFilterBarProps {
  filters: AdrFilters;
  onFiltersChange: (filters: AdrFilters) => void;
  availableRepositories?: string[];
  availableAuthors?: string[];
  availableCategories?: string[];
  savedPresets?: SavedFilterPreset[];
  onSavePreset?: (name: string, filters: AdrFilters) => void;
  onDeletePreset?: (id: string) => void;
  compact?: boolean;
}

export const AdrFilterBar = ({
  filters,
  onFiltersChange,
  availableRepositories = [],
  availableAuthors = [],
  availableCategories = [],
  savedPresets = [],
  onSavePreset,
  onDeletePreset,
  compact = false,
}: AdrFilterBarProps) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const allPresets = [...DEFAULT_PRESETS, ...savedPresets];

  const updateFilter = useCallback(
    <K extends keyof AdrFilters>(key: K, value: AdrFilters[K]) => {
      const newFilters = { ...filters };
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange],
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const applyPreset = useCallback(
    (preset: SavedFilterPreset) => {
      onFiltersChange(preset.filters);
    },
    [onFiltersChange],
  );

  const handleSavePreset = useCallback(() => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setSaveDialogOpen(false);
    }
  }, [presetName, filters, onSavePreset]);

  const hasActiveFilters =
    Object.keys(filters).filter(k => {
      const value = filters[k as keyof AdrFilters];
      return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
    }).length > 0;

  const getActiveFilterLabels = (): Array<{ key: string; label: string }> => {
    const labels: Array<{ key: string; label: string }> = [];

    if (filters.status && filters.status.length > 0) {
      labels.push({ key: 'status', label: `Status: ${filters.status.join(', ')}` });
    }
    if (filters.author) {
      labels.push({ key: 'author', label: `Author: ${filters.author}` });
    }
    if (filters.repositoryUrl) {
      const repoName = filters.repositoryUrl.split('/').slice(-2).join('/');
      labels.push({ key: 'repositoryUrl', label: `Repo: ${repoName}` });
    }
    if (filters.category) {
      labels.push({ key: 'category', label: `Category: ${filters.category}` });
    }
    if (filters.createdAfter || filters.createdBefore) {
      const range = [filters.createdAfter, filters.createdBefore].filter(Boolean).join(' - ');
      labels.push({ key: 'created', label: `Created: ${range}` });
    }
    if (filters.updatedAfter || filters.updatedBefore) {
      const range = [filters.updatedAfter, filters.updatedBefore].filter(Boolean).join(' - ');
      labels.push({ key: 'updated', label: `Updated: ${range}` });
    }
    if (filters.search) {
      labels.push({ key: 'search', label: `Search: "${filters.search}"` });
    }

    return labels;
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    if (key === 'created') {
      delete newFilters.createdAfter;
      delete newFilters.createdBefore;
    } else if (key === 'updated') {
      delete newFilters.updatedAfter;
      delete newFilters.updatedBefore;
    } else {
      delete newFilters[key as keyof AdrFilters];
    }
    onFiltersChange(newFilters);
  };

  if (compact) {
    return (
      <Box className={classes.root}>
        <Box className={classes.mainRow}>
          <TextField
            className={classes.searchField}
            placeholder="Search ADRs..."
            variant="outlined"
            size="small"
            value={filters.search || ''}
            onChange={e => updateFilter('search', e.target.value || undefined)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" size="small" className={classes.filterControl}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status || []}
              onChange={e => updateFilter('status', e.target.value as AdrStatus[])}
              label="Status"
              renderValue={selected =>
                (selected as string[]).length === 0
                  ? 'All'
                  : (selected as string[]).join(', ')
              }
            >
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Box className={classes.mainRow}>
        <TextField
          className={classes.searchField}
          placeholder="Search ADRs..."
          variant="outlined"
          size="small"
          value={filters.search || ''}
          onChange={e => updateFilter('search', e.target.value || undefined)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl variant="outlined" size="small" className={classes.filterControl}>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={filters.status || []}
            onChange={e => updateFilter('status', e.target.value as AdrStatus[])}
            label="Status"
            renderValue={selected =>
              (selected as string[]).length === 0
                ? 'All'
                : (selected as string[]).join(', ')
            }
          >
            {STATUS_OPTIONS.map(status => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title={expanded ? 'Hide filters' : 'Show more filters'}>
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            <FilterListIcon />
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>

        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearAllFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}

        {onSavePreset && hasActiveFilters && (
          <Tooltip title="Save current filters as preset">
            <IconButton onClick={() => setSaveDialogOpen(true)} size="small">
              <BookmarkBorderIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {hasActiveFilters && !expanded && (
        <Box className={classes.activeFiltersSection}>
          <Typography variant="body2" color="textSecondary">
            Active filters:
          </Typography>
          {getActiveFilterLabels().map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              size="small"
              onDelete={() => removeFilter(key)}
              className={classes.activeFilterChip}
            />
          ))}
        </Box>
      )}

      <Collapse in={expanded}>
        <Paper variant="outlined" className={classes.expandedFilters}>
          <Box className={classes.presetSection}>
            <Typography variant="body2" className={classes.presetLabel}>
              <BookmarkIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Quick filters:
            </Typography>
            {allPresets.map(preset => (
              <Chip
                key={preset.id}
                label={preset.name}
                onClick={() => applyPreset(preset)}
                onDelete={
                  !preset.isDefault && onDeletePreset
                    ? () => onDeletePreset(preset.id)
                    : undefined
                }
                className={classes.presetChip}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>

          <Divider style={{ margin: '16px 0' }} />

          <Box className={classes.filterRow}>
            {availableAuthors.length > 0 && (
              <FormControl variant="outlined" size="small" className={classes.filterControl}>
                <InputLabel>Author</InputLabel>
                <Select
                  value={filters.author || ''}
                  onChange={e => updateFilter('author', e.target.value as string || undefined)}
                  label="Author"
                >
                  <MenuItem value="">
                    <em>All Authors</em>
                  </MenuItem>
                  {availableAuthors.map(author => (
                    <MenuItem key={author} value={author}>
                      {author}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {availableRepositories.length > 0 && (
              <FormControl variant="outlined" size="small" className={classes.filterControl}>
                <InputLabel>Repository</InputLabel>
                <Select
                  value={filters.repositoryUrl || ''}
                  onChange={e => updateFilter('repositoryUrl', e.target.value as string || undefined)}
                  label="Repository"
                >
                  <MenuItem value="">
                    <em>All Repositories</em>
                  </MenuItem>
                  {availableRepositories.map(repo => (
                    <MenuItem key={repo} value={repo}>
                      {repo.split('/').slice(-2).join('/')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {availableCategories.length > 0 && (
              <FormControl variant="outlined" size="small" className={classes.filterControl}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={e => updateFilter('category', e.target.value as string || undefined)}
                  label="Category"
                >
                  <MenuItem value="">
                    <em>All Categories</em>
                  </MenuItem>
                  {availableCategories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Date Filters
          </Typography>
          <Box className={classes.filterRow}>
            <TextField
              label="Created After"
              type="date"
              variant="outlined"
              size="small"
              className={classes.dateField}
              value={filters.createdAfter || ''}
              onChange={e => updateFilter('createdAfter', e.target.value || undefined)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Created Before"
              type="date"
              variant="outlined"
              size="small"
              className={classes.dateField}
              value={filters.createdBefore || ''}
              onChange={e => updateFilter('createdBefore', e.target.value || undefined)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Updated After"
              type="date"
              variant="outlined"
              size="small"
              className={classes.dateField}
              value={filters.updatedAfter || ''}
              onChange={e => updateFilter('updatedAfter', e.target.value || undefined)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Updated Before"
              type="date"
              variant="outlined"
              size="small"
              className={classes.dateField}
              value={filters.updatedBefore || ''}
              onChange={e => updateFilter('updatedBefore', e.target.value || undefined)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box className={classes.buttonGroup}>
            <Button size="small" onClick={clearAllFilters}>
              Clear All
            </Button>
          </Box>
        </Paper>
      </Collapse>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder="e.g., My Security ADRs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} color="primary" disabled={!presetName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
