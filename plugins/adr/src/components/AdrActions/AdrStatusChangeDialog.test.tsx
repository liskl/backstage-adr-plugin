import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdrStatusChangeDialog } from './AdrStatusChangeDialog';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';
import { TestApiProvider } from '@backstage/test-utils';
import { adrApiRef } from '../../api';

const mockAdrApi = {
  updateAdrStatus: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <TestApiProvider apis={[[adrApiRef, mockAdrApi]]}>
      <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>
    </TestApiProvider>,
  );
};

describe('AdrStatusChangeDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onStatusChanged: jest.fn(),
    adrId: 'test-adr-id',
    adrTitle: 'Test ADR Title',
    currentStatus: 'proposed' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      renderWithProviders(<AdrStatusChangeDialog {...defaultProps} />);

      expect(screen.getByText('Change ADR Status')).toBeInTheDocument();
      expect(screen.getByText('Test ADR Title')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProviders(
        <AdrStatusChangeDialog {...defaultProps} open={false} />,
      );

      expect(screen.queryByText('Change ADR Status')).not.toBeInTheDocument();
    });

    it('should show current status badges', () => {
      renderWithProviders(<AdrStatusChangeDialog {...defaultProps} />);

      // Should show current status (proposed)
      const badges = screen.getAllByText('Proposed');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should render update button', () => {
      renderWithProviders(<AdrStatusChangeDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
    });
  });

  describe('status selection', () => {
    it('should disable update button when status unchanged', () => {
      renderWithProviders(<AdrStatusChangeDialog {...defaultProps} />);

      const updateButton = screen.getByRole('button', { name: /update status/i });
      expect(updateButton).toBeDisabled();
    });
  });

  describe('cancel', () => {
    it('should call onClose when cancel is clicked', () => {
      renderWithProviders(<AdrStatusChangeDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
