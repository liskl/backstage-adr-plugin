import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdrList } from './AdrList';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';
import { MemoryRouter } from 'react-router-dom';
import { AdrSummary } from '@backstage-community/plugin-adr-common';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>
    </MemoryRouter>,
  );
};

const mockAdrs: AdrSummary[] = [
  {
    id: 'adr-1',
    title: 'Use OAuth 2.0',
    number: 1,
    status: 'accepted',
    updatedAt: '2024-01-15T10:00:00Z',
    repositoryUrl: 'https://github.com/org/repo',
    filePath: 'docs/adr/0001-use-oauth.md',
    tags: ['security', 'api'],
  },
  {
    id: 'adr-2',
    title: 'Use PostgreSQL',
    number: 2,
    status: 'proposed',
    updatedAt: '2024-01-16T10:00:00Z',
    repositoryUrl: 'https://github.com/org/repo',
    filePath: 'docs/adr/0002-use-postgresql.md',
    tags: ['database'],
    category: 'infrastructure',
  },
  {
    id: 'adr-3',
    title: 'Use React',
    number: 3,
    status: 'draft',
    updatedAt: '2024-01-17T10:00:00Z',
    repositoryUrl: 'https://github.com/org/repo',
    filePath: 'docs/adr/0003-use-react.md',
    tags: [],
  },
];

describe('AdrList', () => {
  describe('rendering', () => {
    it('should render ADR titles', () => {
      renderWithProviders(<AdrList adrs={mockAdrs} />);

      expect(screen.getByText(/Use OAuth 2\.0/)).toBeInTheDocument();
      expect(screen.getByText(/Use PostgreSQL/)).toBeInTheDocument();
      expect(screen.getByText(/Use React/)).toBeInTheDocument();
    });

    it('should render ADR numbers with padding', () => {
      renderWithProviders(<AdrList adrs={mockAdrs} />);

      expect(screen.getByText('0001')).toBeInTheDocument();
      expect(screen.getByText('0002')).toBeInTheDocument();
      expect(screen.getByText('0003')).toBeInTheDocument();
    });

    it('should render status badges', () => {
      renderWithProviders(<AdrList adrs={mockAdrs} />);

      expect(screen.getByText('accepted')).toBeInTheDocument();
      expect(screen.getByText('proposed')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('should render tags in non-compact mode', () => {
      renderWithProviders(<AdrList adrs={mockAdrs} />);

      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('api')).toBeInTheDocument();
      expect(screen.getByText('database')).toBeInTheDocument();
    });

    it('should show +N chip when more than 3 tags', () => {
      const adrWithManyTags: AdrSummary[] = [
        {
          ...mockAdrs[0],
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        },
      ];

      renderWithProviders(<AdrList adrs={adrWithManyTags} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render empty table when no ADRs', () => {
      renderWithProviders(<AdrList adrs={[]} />);

      expect(screen.getByText('No records to display')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      renderWithProviders(<AdrList adrs={[]} loading />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error panel when error occurs', () => {
      const error = new Error('Failed to load ADRs');

      renderWithProviders(<AdrList adrs={[]} error={error} />);

      expect(screen.getByText('Failed to load ADRs')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode', () => {
      renderWithProviders(<AdrList adrs={mockAdrs} compact />);

      // Should still show titles and statuses
      expect(screen.getByText(/Use OAuth 2\.0/)).toBeInTheDocument();
      expect(screen.getByText('accepted')).toBeInTheDocument();
    });
  });

  describe('search and filters', () => {
    it('should render search input when onSearchChange provided', () => {
      const onSearchChange = jest.fn();

      renderWithProviders(
        <AdrList
          adrs={mockAdrs}
          searchQuery=""
          onSearchChange={onSearchChange}
        />,
      );

      expect(screen.getByPlaceholderText('Search ADRs...')).toBeInTheDocument();
    });

    it('should call onSearchChange when search input changes', () => {
      const onSearchChange = jest.fn();

      renderWithProviders(
        <AdrList
          adrs={mockAdrs}
          searchQuery=""
          onSearchChange={onSearchChange}
        />,
      );

      const searchInput = screen.getByPlaceholderText('Search ADRs...');
      fireEvent.change(searchInput, { target: { value: 'oauth' } });

      expect(onSearchChange).toHaveBeenCalledWith('oauth');
    });

    it('should render status filter when onStatusFilterChange provided', () => {
      const onStatusFilterChange = jest.fn();

      renderWithProviders(
        <AdrList
          adrs={mockAdrs}
          statusFilter={[]}
          onStatusFilterChange={onStatusFilterChange}
        />,
      );

      expect(screen.getByText('All Statuses')).toBeInTheDocument();
    });
  });

  describe('links', () => {
    it('should create correct links to ADR detail pages', () => {
      renderWithProviders(<AdrList adrs={mockAdrs} />);

      const link = screen.getByText(/Use OAuth 2\.0/).closest('a');
      expect(link).toHaveAttribute('href', '/adr/adr-1');
    });

    it('should URL-encode ADR IDs in links', () => {
      const adrWithSpecialId: AdrSummary[] = [
        {
          ...mockAdrs[0],
          id: 'github.com/org/repo/docs/adr/0001.md',
        },
      ];

      renderWithProviders(<AdrList adrs={adrWithSpecialId} />);

      const link = screen.getByText(/Use OAuth 2\.0/).closest('a');
      expect(link).toHaveAttribute(
        'href',
        '/adr/github.com%2Forg%2Frepo%2Fdocs%2Fadr%2F0001.md',
      );
    });
  });
});
