import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdrMarkdownEditor } from './AdrMarkdownEditor';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>,
  );
};

describe('AdrMarkdownEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the editor with tabs', () => {
      renderWithTheme(<AdrMarkdownEditor {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /write/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /split/i })).toBeInTheDocument();
    });

    it('should render toolbar buttons', () => {
      renderWithTheme(<AdrMarkdownEditor {...defaultProps} />);

      // Toolbar should be visible in split mode (default)
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    });

    it('should display placeholder when empty', () => {
      renderWithTheme(
        <AdrMarkdownEditor
          {...defaultProps}
          placeholder="Custom placeholder"
        />,
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('should switch to preview mode', () => {
      renderWithTheme(
        <AdrMarkdownEditor {...defaultProps} value="# Hello World" />,
      );

      fireEvent.click(screen.getByRole('tab', { name: /preview/i }));

      // In preview mode, we should see the rendered markdown
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should switch to write mode', () => {
      renderWithTheme(<AdrMarkdownEditor {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: /write/i }));

      // In write mode, toolbar should not show preview pane text
      expect(screen.queryByText('Preview will appear here...')).not.toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('should call onChange when text is entered', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <AdrMarkdownEditor {...defaultProps} onChange={onChange} />,
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New content' } });

      expect(onChange).toHaveBeenCalledWith('New content');
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithTheme(
        <AdrMarkdownEditor {...defaultProps} disabled />,
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  describe('preview', () => {
    it('should render markdown in preview', () => {
      renderWithTheme(
        <AdrMarkdownEditor
          {...defaultProps}
          value="**Bold** and _italic_"
        />,
      );

      fireEvent.click(screen.getByRole('tab', { name: /preview/i }));

      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText(/and/)).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });

    it('should show placeholder in empty preview', () => {
      renderWithTheme(<AdrMarkdownEditor {...defaultProps} value="" />);

      fireEvent.click(screen.getByRole('tab', { name: /preview/i }));

      expect(screen.getByText('Preview will appear here...')).toBeInTheDocument();
    });
  });
});
