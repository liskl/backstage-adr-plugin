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
  TextField,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useApi } from '@backstage/core-plugin-api';
import { adrApiRef } from '../../api';

interface AdrDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleted: (prUrl: string) => void;
  adrId: string;
  adrTitle: string;
}

export const AdrDeleteDialog = ({
  open,
  onClose,
  onDeleted,
  adrId,
  adrTitle,
}: AdrDeleteDialogProps) => {
  const adrApi = useApi(adrApiRef);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const isConfirmed = confirmText.toLowerCase() === 'delete';

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const pr = await adrApi.deleteAdr(adrId);
      onDeleted(pr.url);
    } catch (err: any) {
      setError(err.message || 'Failed to delete ADR');
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      setConfirmText('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete ADR</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Are you sure you want to delete this ADR?
        </Typography>
        <Box
          my={2}
          p={2}
          bgcolor="action.hover"
          borderRadius={1}
        >
          <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
            {adrTitle}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ID: {adrId}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          This action will create a Pull Request to remove the ADR from the
          repository. The ADR will not be deleted until the PR is merged.
        </Typography>

        <Box mt={3}>
          <Typography variant="body2" gutterBottom>
            Type <strong>delete</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="delete"
            disabled={deleting}
            autoFocus
          />
        </Box>

        {error && (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          color="secondary"
          variant="contained"
          disabled={!isConfirmed || deleting}
        >
          {deleting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Delete ADR'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
