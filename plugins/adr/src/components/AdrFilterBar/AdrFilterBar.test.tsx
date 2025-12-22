import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdrFilterBar } from './AdrFilterBar';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';
import { AdrFilters, SavedFilterPreset } from '@backstage-community/plugin-adr-common';

// Mock ResizeObserver for tests
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as any;

// Suppress Material-UI deprecation warnings about findDOMNode
/* eslint-disable no-console */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
/* eslint-enable no-console */

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>,
  );
};

describe('AdrFilterBar', () => {
  const defaultProps = {
    filters: {} as AdrFilters,
    onFiltersChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should render search input', () => {
      renderWithProviders(<AdrFilterBar {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search ADRs...')).toBeInTheDocument();
    });

    it('should call onFiltersChange when search input changes', () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <AdrFilterBar {...defaultProps} onFiltersChange={onFiltersChange} />,
      );

      const searchInput = screen.getByPlaceholderText('Search ADRs...');
      fireEvent.change(searchInput, { target: { value: 'oauth' } });

      expect(onFiltersChange).toHaveBeenCalledWith({ search: 'oauth' });
    });

    it('should show current search value', () => {
      renderWithProviders(
        <AdrFilterBar {...defaultProps} filters={{ search: 'test query' }} />,
      );

      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });
  });

  describe('status filter', () => {
    it('should render status dropdown', () => {
      renderWithProviders(<AdrFilterBar {...defaultProps} />);

      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should render compact version with fewer elements', () => {
      renderWithProviders(<AdrFilterBar {...defaultProps} compact />);

      expect(screen.getByPlaceholderText('Search ADRs...')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      // Expand button should not be visible in compact mode
      expect(screen.queryByLabelText(/show more filters/i)).not.toBeInTheDocument();
    });
  });

  describe('expanded filters', () => {
    it('should show expand button in non-compact mode', () => {
      renderWithProviders(<AdrFilterBar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /hide filters|show more filters/i })).toBeInTheDocument();
    });

    it('should show date filters when expanded', () => {
      renderWithProviders(<AdrFilterBar {...defaultProps} />);

      // Click expand button
      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      expect(screen.getByLabelText('Created After')).toBeInTheDocument();
      expect(screen.getByLabelText('Created Before')).toBeInTheDocument();
      expect(screen.getByLabelText('Updated After')).toBeInTheDocument();
      expect(screen.getByLabelText('Updated Before')).toBeInTheDocument();
    });

    it('should show author filter when expanded and authors provided', () => {
      renderWithProviders(
        <AdrFilterBar
          {...defaultProps}
          availableAuthors={['Alice', 'Bob']}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      expect(screen.getByLabelText('Author')).toBeInTheDocument();
    });

    it('should show repository filter when expanded and repositories provided', () => {
      renderWithProviders(
        <AdrFilterBar
          {...defaultProps}
          availableRepositories={['https://github.com/org/repo1', 'https://github.com/org/repo2']}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      expect(screen.getByLabelText('Repository')).toBeInTheDocument();
    });
  });

  describe('active filters display', () => {
    it('should show active filter chips when filters are applied', () => {
      renderWithProviders(
        <AdrFilterBar
          {...defaultProps}
          filters={{
            status: ['accepted'],
            search: 'test',
          }}
        />,
      );

      expect(screen.getByText(/Status: accepted/i)).toBeInTheDocument();
      expect(screen.getByText(/Search: "test"/i)).toBeInTheDocument();
    });

    it('should show clear all button when filters are active', () => {
      renderWithProviders(
        <AdrFilterBar
          {...defaultProps}
          filters={{ status: ['accepted'] }}
        />,
      );

      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    it('should clear all filters when clear button clicked', () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <AdrFilterBar
          filters={{ status: ['accepted'], search: 'test' }}
          onFiltersChange={onFiltersChange}
        />,
      );

      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      fireEvent.click(clearButton);

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('filter presets', () => {
    it('should show default presets when expanded', () => {
      renderWithProviders(<AdrFilterBar {...defaultProps} />);

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('Active Decisions')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('Updated Recently')).toBeInTheDocument();
    });

    it('should apply preset filters when clicked', () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <AdrFilterBar
          filters={{}}
          onFiltersChange={onFiltersChange}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      const activeDecisionsChip = screen.getByText('Active Decisions');
      fireEvent.click(activeDecisionsChip);

      expect(onFiltersChange).toHaveBeenCalledWith({ status: ['accepted'] });
    });

    it('should show saved presets', () => {
      const savedPresets: SavedFilterPreset[] = [
        {
          id: 'custom-1',
          name: 'My Security ADRs',
          filters: { status: ['accepted'], search: 'security' },
          createdAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(
        <AdrFilterBar
          {...defaultProps}
          savedPresets={savedPresets}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('My Security ADRs')).toBeInTheDocument();
    });

    it('should call onSavePreset when saving a new preset', () => {
      const onSavePreset = jest.fn();
      renderWithProviders(
        <AdrFilterBar
          filters={{ status: ['accepted'] }}
          onFiltersChange={jest.fn()}
          onSavePreset={onSavePreset}
        />,
      );

      // Click save preset button
      const saveButton = screen.getByRole('button', { name: /save current filters as preset/i });
      fireEvent.click(saveButton);

      // Enter preset name in dialog
      const nameInput = screen.getByLabelText('Preset Name');
      fireEvent.change(nameInput, { target: { value: 'My Filter' } });

      // Click save in dialog
      const dialogSaveButton = screen.getByRole('button', { name: /^save$/i });
      fireEvent.click(dialogSaveButton);

      expect(onSavePreset).toHaveBeenCalledWith('My Filter', { status: ['accepted'] });
    });

    it('should call onDeletePreset when deleting a custom preset', () => {
      const onDeletePreset = jest.fn();
      const savedPresets: SavedFilterPreset[] = [
        {
          id: 'custom-1',
          name: 'My Custom Preset',
          filters: { status: ['draft'] },
          createdAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(
        <AdrFilterBar
          {...defaultProps}
          savedPresets={savedPresets}
          onDeletePreset={onDeletePreset}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      // Find the delete button on the custom preset chip
      const presetChip = screen.getByText('My Custom Preset').closest('.MuiChip-root');
      const deleteButton = presetChip?.querySelector('.MuiChip-deleteIcon');
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      expect(onDeletePreset).toHaveBeenCalledWith('custom-1');
    });
  });

  describe('date filters', () => {
    it('should update createdAfter filter', () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <AdrFilterBar
          filters={{}}
          onFiltersChange={onFiltersChange}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      const createdAfterInput = screen.getByLabelText('Created After');
      fireEvent.change(createdAfterInput, { target: { value: '2024-01-01' } });

      expect(onFiltersChange).toHaveBeenCalledWith({ createdAfter: '2024-01-01' });
    });

    it('should update updatedBefore filter', () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <AdrFilterBar
          filters={{}}
          onFiltersChange={onFiltersChange}
        />,
      );

      const expandButton = screen.getByRole('button', { name: /show more filters/i });
      fireEvent.click(expandButton);

      const updatedBeforeInput = screen.getByLabelText('Updated Before');
      fireEvent.change(updatedBeforeInput, { target: { value: '2024-12-31' } });

      expect(onFiltersChange).toHaveBeenCalledWith({ updatedBefore: '2024-12-31' });
    });
  });

  describe('removing individual filters', () => {
    it('should remove status filter when chip deleted', () => {
      const onFiltersChange = jest.fn();
      renderWithProviders(
        <AdrFilterBar
          filters={{ status: ['accepted'], search: 'test' }}
          onFiltersChange={onFiltersChange}
        />,
      );

      const statusChip = screen.getByText(/Status: accepted/i).closest('.MuiChip-root');
      const deleteButton = statusChip?.querySelector('.MuiChip-deleteIcon');
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      expect(onFiltersChange).toHaveBeenCalledWith({ search: 'test' });
    });
  });
});
