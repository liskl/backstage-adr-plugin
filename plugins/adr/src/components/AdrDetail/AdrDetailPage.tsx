import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Content,
  ContentHeader,
  Header,
  HeaderLabel,
  InfoCard,
  Link,
  Page,
  Progress,
  WarningPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
  makeStyles,
} from '@material-ui/core';
import {
  Edit,
  Delete,
  MoreVert,
  SwapHoriz,
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import ReactMarkdown from 'react-markdown';
import { useAsync } from 'react-use';
import { adrApiRef } from '../../api';
import { AdrStatusBadge } from '../AdrList';
import { AdrDeleteDialog, AdrStatusChangeDialog } from '../AdrActions';

const useStyles = makeStyles(theme => ({
  markdown: {
    '& h1': {
      ...theme.typography.h4,
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(2),
    },
    '& h2': {
      ...theme.typography.h5,
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(2),
    },
    '& h3': {
      ...theme.typography.h6,
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
    '& p': {
      ...theme.typography.body1,
      marginBottom: theme.spacing(2),
    },
    '& ul, & ol': {
      marginBottom: theme.spacing(2),
      paddingLeft: theme.spacing(3),
    },
    '& li': {
      marginBottom: theme.spacing(0.5),
    },
    '& code': {
      fontFamily: 'monospace',
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(0.25, 0.5),
      borderRadius: 4,
    },
    '& pre': {
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(2),
      borderRadius: 4,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.divider}`,
      paddingLeft: theme.spacing(2),
      marginLeft: 0,
      color: theme.palette.text.secondary,
    },
  },
  metadata: {
    marginTop: theme.spacing(2),
  },
  metadataItem: {
    marginBottom: theme.spacing(1),
  },
  metadataLabel: {
    fontWeight: 500,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  tags: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  sidebarCard: {
    marginBottom: theme.spacing(2),
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

/**
 * Detail page for viewing a single ADR
 */
export const AdrDetailPage = () => {
  const classes = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const adrApi = useApi(adrApiRef);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [prUrl, setPrUrl] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const { value: adr, loading, error } = useAsync(
    () => adrApi.getAdr(id!),
    [adrApi, id],
  );

  const { value: relatedAdrs } = useAsync(
    () => (id ? adrApi.getRelatedAdrs(id) : Promise.resolve([])),
    [adrApi, id],
  );

  const handleEdit = () => {
    navigate(`/adr/${encodeURIComponent(id!)}/edit`);
  };

  const handleDeleteComplete = (url: string) => {
    setDeleteDialogOpen(false);
    setPrUrl(url);
    setPrDialogOpen(true);
    setSuccessMessage('Delete PR created successfully');
  };

  const handleStatusChangeComplete = (url: string) => {
    setStatusDialogOpen(false);
    setPrUrl(url);
    setPrDialogOpen(true);
    setSuccessMessage('Status change PR created successfully');
  };

  const handlePrDialogClose = () => {
    setPrDialogOpen(false);
    // Optionally navigate away after delete
  };

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return (
      <WarningPanel title="Failed to load ADR" message={error.message} />
    );
  }

  if (!adr) {
    return (
      <WarningPanel title="ADR not found" message={`No ADR found with ID: ${id}`} />
    );
  }

  const adrNumber = String(adr.number).padStart(4, '0');

  return (
    <Page themeId="documentation">
      <Header title={`ADR-${adrNumber}: ${adr.title}`}>
        <HeaderLabel label="Status" value={adr.status} />
        <HeaderLabel
          label="Updated"
          value={new Date(adr.updatedAt).toLocaleDateString()}
        />
      </Header>
      <Content>
        <ContentHeader title="">
          <Box className={classes.actionButtons}>
            <AdrStatusBadge status={adr.status} size="medium" />
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHoriz />}
              onClick={() => setStatusDialogOpen(true)}
            >
              Change Status
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <IconButton
              size="small"
              onClick={e => setMenuAnchor(e.currentTarget)}
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setDeleteDialogOpen(true);
                }}
              >
                <Delete fontSize="small" style={{ marginRight: 8 }} />
                Delete ADR
              </MenuItem>
            </Menu>
          </Box>
        </ContentHeader>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <InfoCard title="Decision Record">
              <div className={classes.markdown}>
                <ReactMarkdown>{adr.content}</ReactMarkdown>
              </div>
            </InfoCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <InfoCard title="Metadata" className={classes.sidebarCard}>
              <div className={classes.metadata}>
                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    Number
                  </Typography>
                  <Typography variant="body2">ADR-{adrNumber}</Typography>
                </div>

                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    Status
                  </Typography>
                  <Box>
                    <AdrStatusBadge status={adr.status} />
                  </Box>
                </div>

                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    Format
                  </Typography>
                  <Typography variant="body2">{adr.format}</Typography>
                </div>

                <Divider className={classes.divider} />

                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(adr.createdAt).toLocaleDateString()}
                  </Typography>
                </div>

                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(adr.updatedAt).toLocaleDateString()}
                  </Typography>
                </div>

                {adr.authors.length > 0 && (
                  <div className={classes.metadataItem}>
                    <Typography className={classes.metadataLabel} variant="caption">
                      Authors
                    </Typography>
                    <Typography variant="body2">
                      {adr.authors.join(', ')}
                    </Typography>
                  </div>
                )}

                <Divider className={classes.divider} />

                {adr.tags.length > 0 && (
                  <div className={classes.metadataItem}>
                    <Typography className={classes.metadataLabel} variant="caption">
                      Tags
                    </Typography>
                    <div className={classes.tags}>
                      {adr.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </div>
                  </div>
                )}

                {adr.category && (
                  <div className={classes.metadataItem}>
                    <Typography className={classes.metadataLabel} variant="caption">
                      Category
                    </Typography>
                    <Typography variant="body2">{adr.category}</Typography>
                  </div>
                )}

                <Divider className={classes.divider} />

                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    Repository
                  </Typography>
                  <Typography variant="body2">
                    <Link to={adr.repositoryUrl} target="_blank">
                      {adr.repositoryUrl.replace('https://github.com/', '')}
                    </Link>
                  </Typography>
                </div>

                <div className={classes.metadataItem}>
                  <Typography className={classes.metadataLabel} variant="caption">
                    File Path
                  </Typography>
                  <Typography variant="body2">{adr.filePath}</Typography>
                </div>
              </div>
            </InfoCard>

            {relatedAdrs && relatedAdrs.length > 0 && (
              <InfoCard title="Related ADRs" className={classes.sidebarCard}>
                <List dense>
                  {relatedAdrs.map(related => (
                    <ListItem
                      key={related.id}
                      component={Link}
                      to={`/adr/${encodeURIComponent(related.id)}`}
                    >
                      <ListItemText
                        primary={`ADR-${String(related.number).padStart(4, '0')}: ${related.title}`}
                        secondary={<AdrStatusBadge status={related.status} />}
                      />
                    </ListItem>
                  ))}
                </List>
              </InfoCard>
            )}

            {adr.linkedEntities.length > 0 && (
              <InfoCard title="Linked Entities" className={classes.sidebarCard}>
                <List dense>
                  {adr.linkedEntities.map(entity => (
                    <ListItem
                      key={`${entity.kind}:${entity.namespace}/${entity.name}`}
                      component={Link}
                      to={`/catalog/${entity.namespace}/${entity.kind.toLowerCase()}/${entity.name}`}
                    >
                      <ListItemText
                        primary={entity.name}
                        secondary={entity.kind}
                      />
                    </ListItem>
                  ))}
                </List>
              </InfoCard>
            )}
          </Grid>
        </Grid>

        {/* Delete Dialog */}
        <AdrDeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDeleted={handleDeleteComplete}
          adrId={adr.id}
          adrTitle={adr.title}
        />

        {/* Status Change Dialog */}
        <AdrStatusChangeDialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          onStatusChanged={handleStatusChangeComplete}
          adrId={adr.id}
          adrTitle={adr.title}
          currentStatus={adr.status}
        />

        {/* PR Created Dialog */}
        <Dialog open={prDialogOpen} onClose={handlePrDialogClose}>
          <DialogTitle>Pull Request Created</DialogTitle>
          <DialogContent>
            <Typography>
              A Pull Request has been created for your changes.
              Review and merge it to apply the changes.
            </Typography>
            <Box mt={2}>
              <Button
                variant="outlined"
                color="primary"
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Pull Request
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePrDialogClose} color="primary">
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Content>
    </Page>
  );
};
