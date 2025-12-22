import React from 'react';
import {
  makeStyles,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Typography,
  Paper,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { AdrStatus } from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  section: {
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  formControl: {
    width: '100%',
  },
  chip: {
    margin: theme.spacing(0.5),
  },
}));

export interface AdrMetadata {
  title: string;
  number?: number;
  status: AdrStatus;
  authors: string[];
  decisionMakers: string[];
  tags: string[];
  category: string;
  supersedes: string[];
}

interface AdrMetadataFormProps {
  metadata: AdrMetadata;
  onChange: (metadata: AdrMetadata) => void;
  isNew?: boolean;
  availableTags?: string[];
  availableCategories?: string[];
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: AdrStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'superseded', label: 'Superseded' },
];

export const AdrMetadataForm = ({
  metadata,
  onChange,
  isNew = false,
  availableTags = [],
  availableCategories = [],
  disabled = false,
}: AdrMetadataFormProps) => {
  const classes = useStyles();

  const handleChange = <K extends keyof AdrMetadata>(
    field: K,
    value: AdrMetadata[K],
  ) => {
    onChange({ ...metadata, [field]: value });
  };

  return (
    <Paper className={classes.root} variant="outlined">
      <Typography variant="subtitle1" className={classes.sectionTitle}>
        ADR Metadata
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Title"
            fullWidth
            required
            value={metadata.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g., Use OAuth 2.0 for API Authentication"
            disabled={disabled}
            helperText="A clear, descriptive title for the decision"
          />
        </Grid>

        {!isNew && metadata.number !== undefined && (
          <Grid item xs={12} sm={4}>
            <TextField
              label="ADR Number"
              fullWidth
              value={metadata.number}
              disabled
              helperText="Auto-assigned"
            />
          </Grid>
        )}

        <Grid item xs={12} sm={isNew ? 6 : 4}>
          <FormControl className={classes.formControl}>
            <InputLabel>Status</InputLabel>
            <Select
              value={metadata.status}
              onChange={e => handleChange('status', e.target.value as AdrStatus)}
              disabled={disabled}
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={isNew ? 6 : 4}>
          <Autocomplete
            freeSolo
            options={availableCategories}
            value={metadata.category}
            onChange={(_, newValue) =>
              handleChange('category', newValue || '')
            }
            onInputChange={(_, newValue) =>
              handleChange('category', newValue || '')
            }
            disabled={disabled}
            renderInput={params => (
              <TextField
                {...params}
                label="Category"
                placeholder="e.g., security, infrastructure"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={metadata.authors}
            onChange={(_, newValue) => handleChange('authors', newValue as string[])}
            disabled={disabled}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  className={classes.chip}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label="Authors"
                placeholder="Add author..."
                helperText="Press Enter to add"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={metadata.decisionMakers}
            onChange={(_, newValue) => handleChange('decisionMakers', newValue as string[])}
            disabled={disabled}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  className={classes.chip}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label="Decision Makers"
                placeholder="Add decision maker..."
                helperText="People who made this decision"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={metadata.tags}
            onChange={(_, newValue) => handleChange('tags', newValue)}
            disabled={disabled}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  color="primary"
                  variant="outlined"
                  className={classes.chip}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Add tags..."
                helperText="Keywords for search and filtering"
              />
            )}
          />
        </Grid>

        {metadata.status === 'superseded' && (
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={metadata.supersedes}
              onChange={(_, newValue) => handleChange('supersedes', newValue as string[])}
              disabled={disabled}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    size="small"
                    className={classes.chip}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Supersedes ADRs"
                  placeholder="Add ADR ID..."
                  helperText="IDs of ADRs this decision supersedes"
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};
