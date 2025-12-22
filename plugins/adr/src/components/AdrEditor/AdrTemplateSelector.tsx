import React from 'react';
import {
  makeStyles,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
} from '@material-ui/core';
import { AdrTemplate } from '@backstage-community/plugin-adr-common';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
    fontWeight: 500,
  },
  templateOption: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  selectedTemplate: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected,
  },
  templateName: {
    fontWeight: 500,
  },
  templateDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginTop: theme.spacing(0.5),
  },
  templateFormat: {
    fontSize: '0.75rem',
    color: theme.palette.text.disabled,
    marginTop: theme.spacing(0.5),
  },
}));

interface AdrTemplateSelectorProps {
  templates: AdrTemplate[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
}

export const AdrTemplateSelector = ({
  templates,
  selectedTemplateId,
  onSelect,
  disabled = false,
}: AdrTemplateSelectorProps) => {
  const classes = useStyles();

  const getTemplateDescription = (template: AdrTemplate): string => {
    switch (template.format) {
      case 'madr-v3':
        return 'Modern ADR format with YAML frontmatter, decision drivers, considered options, and consequences.';
      case 'nygard':
        return 'Original ADR format by Michael Nygard. Simple structure: Status, Context, Decision, Consequences.';
      case 'custom':
        return 'Custom template format.';
      default:
        return '';
    }
  };

  return (
    <Paper className={classes.root} variant="outlined">
      <Typography variant="subtitle1" className={classes.title}>
        Choose a Template
      </Typography>

      <RadioGroup
        value={selectedTemplateId}
        onChange={e => onSelect(e.target.value)}
      >
        {templates.map(template => (
          <Box
            key={template.id}
            className={`${classes.templateOption} ${
              selectedTemplateId === template.id ? classes.selectedTemplate : ''
            }`}
            onClick={() => !disabled && onSelect(template.id)}
          >
            <FormControlLabel
              value={template.id}
              control={<Radio color="primary" disabled={disabled} />}
              label={
                <Box>
                  <Typography className={classes.templateName}>
                    {template.name}
                  </Typography>
                  <Typography className={classes.templateDescription}>
                    {getTemplateDescription(template)}
                  </Typography>
                  <Typography className={classes.templateFormat}>
                    Format: {template.format}
                  </Typography>
                </Box>
              }
            />
          </Box>
        ))}
      </RadioGroup>
    </Paper>
  );
};
