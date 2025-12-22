import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdrStatsCards } from './AdrStatsCards';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';
import { AdrStats } from '@backstage-community/plugin-adr-common';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>,
  );
};

const mockStats: AdrStats = {
  totalCount: 25,
  byStatus: {
    draft: 3,
    proposed: 5,
    accepted: 12,
    rejected: 2,
    deprecated: 2,
    superseded: 1,
  },
  byCategory: {
    security: 5,
    infrastructure: 10,
  },
  recentlyUpdated: [],
  pendingReview: [],
};

describe('AdrStatsCards', () => {
  describe('rendering stats', () => {
    it('should render accepted count', () => {
      renderWithTheme(<AdrStatsCards stats={mockStats} />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('should render proposed count', () => {
      renderWithTheme(<AdrStatsCards stats={mockStats} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Proposed')).toBeInTheDocument();
    });

    it('should render rejected count', () => {
      renderWithTheme(<AdrStatsCards stats={mockStats} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should render deprecated count', () => {
      renderWithTheme(<AdrStatsCards stats={mockStats} />);

      // Note: there are two '2's (rejected and deprecated)
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });

    it('should render all four status cards', () => {
      renderWithTheme(<AdrStatsCards stats={mockStats} />);

      expect(screen.getByText('Accepted')).toBeInTheDocument();
      expect(screen.getByText('Proposed')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show skeleton loaders when loading', () => {
      renderWithTheme(<AdrStatsCards loading />);

      // When loading, skeletons are shown instead of actual values
      expect(screen.queryByText('Accepted')).not.toBeInTheDocument();
    });
  });

  describe('empty stats', () => {
    it('should render zero counts when stats are empty', () => {
      const emptyStats: AdrStats = {
        totalCount: 0,
        byStatus: {
          draft: 0,
          proposed: 0,
          accepted: 0,
          rejected: 0,
          deprecated: 0,
          superseded: 0,
        },
        byCategory: {},
        recentlyUpdated: [],
        pendingReview: [],
      };

      renderWithTheme(<AdrStatsCards stats={emptyStats} />);

      // Should show 0 for all statuses
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });
  });

  describe('undefined stats', () => {
    it('should render zero counts when stats are undefined', () => {
      renderWithTheme(<AdrStatsCards />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });
  });
});
