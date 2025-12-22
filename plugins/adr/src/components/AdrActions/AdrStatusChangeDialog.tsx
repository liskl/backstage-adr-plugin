import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  makeStyles,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useApi } from '@backstage/core-plugin-api';
import { adrApiRef } from '../../api';
import { AdrStatus } from '@backstage-community/plugin-adr-common';
import { AdrStatusBadge } from '../AdrList';

const useStyles = makeStyles(theme => ({
  statusTransition: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    margin: theme.spacing(3, 0),
  },
  arrow: {
    fontSize: '1.5rem',
    color: theme.palette.text.secondary,
  },
  formControl: {
    minWidth: 200,
    marginTop: theme.spacing(2),
  },
}));

const STATUS_OPTIONS: { value: AdrStatus; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Work in progress, not yet proposed' },
  { value: 'proposed', label: 'Proposed', description: 'Under discussion/review' },
  { value: 'accepted', label: 'Accepted', description: 'Approved and active' },
  { value: 'rejected', label: 'Rejected', description: 'Considered but not accepted' },
  { value: 'deprecated', label: 'Deprecated', description: 'No longer relevant' },
  { value: 'superseded', label: 'Superseded', description: 'Replaced by another ADR' },
];

interface AdrStatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onStatusChanged: (prUrl: string) => void;
  adrId: string;
  adrTitle: string;
  currentStatus: AdrStatus;
}

export const AdrStatusChangeDialog = ({
  open,
  onClose,
  onStatusChanged,
  adrId,
  adrTitle,
  currentStatus,
}: AdrStatusChangeDialogProps) => {
  const classes = useStyles();
  const adrApi = useApi(adrApiRef);
  const [newStatus, setNewStatus] = useState<AdrStatus>(currentStatus);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanged = newStatus !== currentStatus;

  const handleStatusChange = async () => {
    if (!hasChanged) return;

    setUpdating(true);
    setError(null);

    try {
      const result = await adrApi.updateAdrStatus(adrId, newStatus);
      onStatusChanged(result.pr.url);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (!updating) {
      setNewStatus(currentStatus);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change ADR Status</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 500 }}>
          {adrTitle}
        </Typography>

        <Box className={classes.statusTransition}>
          <AdrStatusBadge status={currentStatus} />
          <span className={classes.arrow}>→</span>
          <AdrStatusBadge status={newStatus} />
        </Box>

        <FormControl variant="outlined" className={classes.formControl} fullWidth>
          <InputLabel>New Status</InputLabel>
          <Select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as AdrStatus)}
            label="New Status"
            disabled={updating}
          >
            {STATUS_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Box>
                  <Typography variant="body1">{option.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box mt={3}>
          <Typography variant="body2" color="textSecondary">
            This will create a Pull Request to update the ADR status. The change
            will take effect once the PR is merged.
          </Typography>
        </Box>

        {error && (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updating}>
          Cancel
        </Button>
        <Button
          onClick={handleStatusChange}
          color="primary"
          variant="contained"
          disabled={!hasChanged || updating}
        >
          {updating ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Update Status'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
