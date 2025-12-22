import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  makeStyles,
  Grid,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  CircularProgress,
  Snackbar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import {
  Content,
  Header,
  Page,
  InfoCard,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { adrApiRef } from '../../api';
import { AdrMarkdownEditor } from './AdrMarkdownEditor';
import { AdrMetadataForm, AdrMetadata } from './AdrMetadataForm';
import { AdrTemplateSelector } from './AdrTemplateSelector';
import {
  Adr,
  AdrTemplate,
  AdrStatus,
} from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
  },
  stepper: {
    backgroundColor: 'transparent',
    padding: theme.spacing(2, 0),
  },
  stepContent: {
    minHeight: 400,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  editorContainer: {
    height: 500,
  },
  prInfo: {
    marginTop: theme.spacing(2),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  repositoryField: {
    marginBottom: theme.spacing(2),
  },
}));

const CREATE_STEPS = ['Choose Template', 'Edit Metadata', 'Write Content', 'Review & Submit'];
const EDIT_STEPS = ['Edit Metadata', 'Edit Content', 'Review & Submit'];

const DEFAULT_METADATA: AdrMetadata = {
  title: '',
  status: 'proposed',
  authors: [],
  decisionMakers: [],
  tags: [],
  category: '',
  supersedes: [],
};

export const AdrEditorPage = () => {
  const classes = useStyles();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adrApi = useApi(adrApiRef);

  const isNew = !id;
  const repositoryUrlParam = searchParams.get('repository');
  const steps = isNew ? CREATE_STEPS : EDIT_STEPS;

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [templates, setTemplates] = useState<AdrTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('madr-v3');
  const [metadata, setMetadata] = useState<AdrMetadata>(DEFAULT_METADATA);
  const [content, setContent] = useState<string>('');
  const [repositoryUrl, setRepositoryUrl] = useState<string>(repositoryUrlParam || '');
  const [originalAdr, setOriginalAdr] = useState<Adr | null>(null);

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [prUrl, setPrUrl] = useState<string>('');

  // Load templates and existing ADR data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load templates
        const loadedTemplates = await adrApi.getTemplates();
        setTemplates(loadedTemplates);
        if (loadedTemplates.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(loadedTemplates[0].id);
        }

        // Load tags and categories for autocomplete
        const [tags, categories] = await Promise.all([
          adrApi.getTags(),
          adrApi.getCategories(),
        ]);
        setAvailableTags(tags);
        setAvailableCategories(categories);

        // If editing, load the existing ADR
        if (id) {
          const adr = await adrApi.getAdr(id);
          if (adr) {
            setOriginalAdr(adr);
            setMetadata({
              title: adr.title,
              number: adr.number,
              status: adr.status,
              authors: adr.authors,
              decisionMakers: adr.decisionMakers,
              tags: adr.tags,
              category: adr.category,
              supersedes: adr.supersedes,
            });
            setContent(adr.content);
            setRepositoryUrl(adr.repositoryUrl);
          } else {
            setError('ADR not found');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, adrApi, selectedTemplateId]);

  // Load template content when template is selected
  useEffect(() => {
    if (isNew && selectedTemplateId && templates.length > 0) {
      const loadTemplateContent = async () => {
        try {
          const template = await adrApi.getTemplate(selectedTemplateId);
          if (template?.defaultContent) {
            setContent(template.defaultContent);
          }
        } catch (err) {
          // Template content is optional, ignore errors
        }
      };
      loadTemplateContent();
    }
  }, [isNew, selectedTemplateId, templates, adrApi]);

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = useCallback((): boolean => {
    if (isNew) {
      switch (activeStep) {
        case 0: // Template selection
          return !!selectedTemplateId;
        case 1: // Metadata
          return !!metadata.title.trim();
        case 2: // Content
          return !!content.trim();
        case 3: // Review
          return !!repositoryUrl.trim();
        default:
          return true;
      }
    } else {
      switch (activeStep) {
        case 0: // Metadata
          return !!metadata.title.trim();
        case 1: // Content
          return !!content.trim();
        case 2: // Review
          return true;
        default:
          return true;
      }
    }
  }, [isNew, activeStep, selectedTemplateId, metadata.title, content, repositoryUrl]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (isNew) {
        const result = await adrApi.createAdr({
          title: metadata.title,
          content,
          status: metadata.status,
          repositoryUrl,
          format: templates.find(t => t.id === selectedTemplateId)?.format || 'madr-v3',
          authors: metadata.authors,
          decisionMakers: metadata.decisionMakers,
          tags: metadata.tags,
          category: metadata.category,
        });
        setPrUrl(result.pr.url);
        setPrDialogOpen(true);
        setSuccess('ADR created successfully! A pull request has been opened.');
      } else if (originalAdr) {
        const result = await adrApi.updateAdr(originalAdr.id, {
          title: metadata.title,
          content,
          status: metadata.status,
          authors: metadata.authors,
          decisionMakers: metadata.decisionMakers,
          tags: metadata.tags,
          category: metadata.category,
        });
        setPrUrl(result.pr.url);
        setPrDialogOpen(true);
        setSuccess('ADR updated successfully! A pull request has been opened.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save ADR');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrDialogClose = () => {
    setPrDialogOpen(false);
    navigate('/adr');
  };

  const renderStepContent = () => {
    if (isNew) {
      switch (activeStep) {
        case 0:
          return (
            <AdrTemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
            />
          );
        case 1:
          return (
            <AdrMetadataForm
              metadata={metadata}
              onChange={setMetadata}
              isNew
              availableTags={availableTags}
              availableCategories={availableCategories}
            />
          );
        case 2:
          return (
            <div className={classes.editorContainer}>
              <AdrMarkdownEditor value={content} onChange={setContent} />
            </div>
          );
        case 3:
          return (
            <Box>
              <TextField
                className={classes.repositoryField}
                label="Target Repository URL"
                fullWidth
                required
                value={repositoryUrl}
                onChange={e => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                helperText="The GitHub repository where this ADR will be created"
              />
              <InfoCard title="Review Your ADR">
                <Typography variant="h6" gutterBottom>
                  {metadata.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status: {metadata.status} | Category: {metadata.category || 'None'} |
                  Tags: {metadata.tags.join(', ') || 'None'}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Authors: {metadata.authors.join(', ') || 'None'}
                </Typography>
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Content Preview:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    style={{
                      whiteSpace: 'pre-wrap',
                      maxHeight: 200,
                      overflow: 'auto',
                      backgroundColor: '#f5f5f5',
                      padding: 16,
                      borderRadius: 4,
                    }}
                  >
                    {content.substring(0, 500)}
                    {content.length > 500 ? '...' : ''}
                  </Typography>
                </Box>
              </InfoCard>
            </Box>
          );
        default:
          return null;
      }
    } else {
      switch (activeStep) {
        case 0:
          return (
            <AdrMetadataForm
              metadata={metadata}
              onChange={setMetadata}
              availableTags={availableTags}
              availableCategories={availableCategories}
            />
          );
        case 1:
          return (
            <div className={classes.editorContainer}>
              <AdrMarkdownEditor value={content} onChange={setContent} />
            </div>
          );
        case 2:
          return (
            <InfoCard title="Review Your Changes">
              <Typography variant="h6" gutterBottom>
                {metadata.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Status: {metadata.status} | Category: {metadata.category || 'None'} |
                Tags: {metadata.tags.join(', ') || 'None'}
              </Typography>
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Content Preview:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  style={{
                    whiteSpace: 'pre-wrap',
                    maxHeight: 200,
                    overflow: 'auto',
                    backgroundColor: '#f5f5f5',
                    padding: 16,
                    borderRadius: 4,
                  }}
                >
                  {content.substring(0, 500)}
                  {content.length > 500 ? '...' : ''}
                </Typography>
              </Box>
            </InfoCard>
          );
        default:
          return null;
      }
    }
  };

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Loading..." />
        <Content>
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        </Content>
      </Page>
    );
  }

  const isLastStep = activeStep === steps.length - 1;

  return (
    <Page themeId="tool">
      <Header
        title={isNew ? 'Create New ADR' : `Edit ADR: ${metadata.title}`}
        subtitle={isNew ? 'Create a new Architecture Decision Record' : 'Edit an existing ADR'}
      />
      <Content>
        <Stepper activeStep={activeStep} className={classes.stepper}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <div className={classes.stepContent}>{renderStepContent()}</div>

            <div className={classes.actions}>
              <Button onClick={() => navigate('/adr')} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || submitting}
              >
                Back
              </Button>
              {isLastStep ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={!validateStep() || submitting}
                >
                  {submitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Create Pull Request'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={!validateStep()}
                >
                  Next
                </Button>
              )}
            </div>
          </Grid>
        </Grid>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        <Dialog open={prDialogOpen} onClose={handlePrDialogClose}>
          <DialogTitle>Pull Request Created</DialogTitle>
          <DialogContent>
            <Typography>
              Your ADR has been submitted as a Pull Request. Review and merge it to
              make the changes live.
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
      </Content>
    </Page>
  );
};
