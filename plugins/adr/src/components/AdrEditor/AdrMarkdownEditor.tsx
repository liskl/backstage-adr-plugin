import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  Paper,
  TextField,
  Typography,
  Tab,
  Tabs,
  Box,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  FormatBold,
  FormatItalic,
  Code,
  Link,
  FormatListBulleted,
  FormatListNumbered,
  Title,
} from '@material-ui/icons';
import ReactMarkdown from 'react-markdown';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 400,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.palette.divider,
    margin: theme.spacing(0, 1),
  },
  tabs: {
    minHeight: 36,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tab: {
    minHeight: 36,
    minWidth: 100,
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  editorPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  previewPane: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
    borderLeft: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  textField: {
    flex: 1,
    '& .MuiInputBase-root': {
      height: '100%',
      alignItems: 'flex-start',
    },
    '& .MuiInputBase-input': {
      height: '100% !important',
      overflow: 'auto !important',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  },
  preview: {
    '& h1': {
      fontSize: '1.5rem',
      marginTop: 0,
      borderBottom: `1px solid ${theme.palette.divider}`,
      paddingBottom: theme.spacing(1),
    },
    '& h2': {
      fontSize: '1.25rem',
      marginTop: theme.spacing(3),
    },
    '& h3': {
      fontSize: '1.1rem',
      marginTop: theme.spacing(2),
    },
    '& p': {
      marginBottom: theme.spacing(1.5),
    },
    '& ul, & ol': {
      paddingLeft: theme.spacing(3),
    },
    '& code': {
      backgroundColor: theme.palette.action.hover,
      padding: theme.spacing(0.25, 0.5),
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: '0.875em',
    },
    '& pre': {
      backgroundColor: theme.palette.action.hover,
      padding: theme.spacing(2),
      borderRadius: 4,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      margin: 0,
      paddingLeft: theme.spacing(2),
      color: theme.palette.text.secondary,
    },
  },
  splitView: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
}));

type ViewMode = 'write' | 'preview' | 'split';

interface AdrMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AdrMarkdownEditor = ({
  value,
  onChange,
  placeholder = 'Write your ADR content here using Markdown...',
  disabled = false,
}: AdrMarkdownEditorProps) => {
  const classes = useStyles();
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const insertText = useCallback(
    (before: string, after: string = '') => {
      const textarea = document.querySelector(
        `.${classes.textField} textarea`,
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);

      onChange(newText);

      // Restore cursor position after React re-render
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange, classes.textField],
  );

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('_', '_');
        break;
      case 'code':
        insertText('`', '`');
        break;
      case 'link':
        insertText('[', '](url)');
        break;
      case 'ul':
        insertText('\n- ');
        break;
      case 'ol':
        insertText('\n1. ');
        break;
      case 'h2':
        insertText('\n## ');
        break;
    }
  };

  const renderToolbar = () => (
    <div className={classes.toolbar}>
      <Tooltip title="Bold (Ctrl+B)">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('bold')}
          disabled={disabled}
        >
          <FormatBold fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Italic (Ctrl+I)">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('italic')}
          disabled={disabled}
        >
          <FormatItalic fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Code">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('code')}
          disabled={disabled}
        >
          <Code fontSize="small" />
        </IconButton>
      </Tooltip>
      <div className={classes.toolbarDivider} />
      <Tooltip title="Heading">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('h2')}
          disabled={disabled}
        >
          <Title fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Bulleted List">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('ul')}
          disabled={disabled}
        >
          <FormatListBulleted fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Numbered List">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('ol')}
          disabled={disabled}
        >
          <FormatListNumbered fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Link">
        <IconButton
          size="small"
          onClick={() => handleToolbarAction('link')}
          disabled={disabled}
        >
          <Link fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );

  const renderEditor = () => (
    <div className={classes.editorPane}>
      <TextField
        className={classes.textField}
        multiline
        fullWidth
        variant="outlined"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );

  const renderPreview = () => (
    <div className={classes.previewPane}>
      {value ? (
        <div className={classes.preview}>
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <Typography color="textSecondary">
          Preview will appear here...
        </Typography>
      )}
    </div>
  );

  return (
    <Paper className={classes.root} variant="outlined">
      <Tabs
        value={viewMode}
        onChange={(_, newValue) => setViewMode(newValue)}
        className={classes.tabs}
        indicatorColor="primary"
      >
        <Tab label="Write" value="write" className={classes.tab} />
        <Tab label="Preview" value="preview" className={classes.tab} />
        <Tab label="Split" value="split" className={classes.tab} />
      </Tabs>
      {viewMode !== 'preview' && renderToolbar()}
      <Box className={classes.content}>
        {viewMode === 'write' && renderEditor()}
        {viewMode === 'preview' && renderPreview()}
        {viewMode === 'split' && (
          <div className={classes.splitView}>
            {renderEditor()}
            {renderPreview()}
          </div>
        )}
      </Box>
    </Paper>
  );
};
