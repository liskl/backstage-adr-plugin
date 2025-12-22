import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdrDeleteDialog } from './AdrDeleteDialog';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';
import { TestApiProvider } from '@backstage/test-utils';
import { adrApiRef } from '../../api';

const mockAdrApi = {
  deleteAdr: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <TestApiProvider apis={[[adrApiRef, mockAdrApi]]}>
      <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>
    </TestApiProvider>,
  );
};

describe('AdrDeleteDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onDeleted: jest.fn(),
    adrId: 'test-adr-id',
    adrTitle: 'Test ADR Title',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Delete ADR' })).toBeInTheDocument();
      expect(screen.getByText('Test ADR Title')).toBeInTheDocument();
      expect(screen.getByText('ID: test-adr-id')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Delete ADR')).not.toBeInTheDocument();
    });

    it('should render confirmation input', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      expect(screen.getByPlaceholderText('delete')).toBeInTheDocument();
    });
  });

  describe('confirmation', () => {
    it('should disable delete button until "delete" is typed', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete adr/i });
      expect(deleteButton).toBeDisabled();
    });

    it('should enable delete button when "delete" is typed', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('delete');
      fireEvent.change(input, { target: { value: 'delete' } });

      const deleteButton = screen.getByRole('button', { name: /delete adr/i });
      expect(deleteButton).not.toBeDisabled();
    });

    it('should be case insensitive for confirmation', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('delete');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      const deleteButton = screen.getByRole('button', { name: /delete adr/i });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('deletion', () => {
    it('should call deleteAdr API when confirmed', async () => {
      mockAdrApi.deleteAdr.mockResolvedValue({ url: 'https://github.com/pr/1' });
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('delete');
      fireEvent.change(input, { target: { value: 'delete' } });

      const deleteButton = screen.getByRole('button', { name: /delete adr/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockAdrApi.deleteAdr).toHaveBeenCalledWith('test-adr-id');
      });
    });

    it('should call onDeleted with PR URL on success', async () => {
      mockAdrApi.deleteAdr.mockResolvedValue({ url: 'https://github.com/pr/1' });
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('delete');
      fireEvent.change(input, { target: { value: 'delete' } });

      const deleteButton = screen.getByRole('button', { name: /delete adr/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(defaultProps.onDeleted).toHaveBeenCalledWith('https://github.com/pr/1');
      });
    });

    it('should show error message on failure', async () => {
      mockAdrApi.deleteAdr.mockRejectedValue(new Error('Delete failed'));
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('delete');
      fireEvent.change(input, { target: { value: 'delete' } });

      const deleteButton = screen.getByRole('button', { name: /delete adr/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });
  });

  describe('cancel', () => {
    it('should call onClose when cancel is clicked', () => {
      renderWithProviders(<AdrDeleteDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
