import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdrPrStatusCard } from './AdrPrStatusCard';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';
import { AdrPullRequest } from '@backstage-community/plugin-adr-common';

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

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>,
  );
};

describe('AdrPrStatusCard', () => {
  const basePr: AdrPullRequest = {
    number: 123,
    title: 'feat: Add OAuth authentication',
    url: 'https://github.com/org/repo/pull/123',
    state: 'open',
    author: 'johndoe',
    createdAt: '2024-01-15T10:00:00Z',
    merged: false,
  };

  describe('rendering', () => {
    it('should render PR number with link', () => {
      renderWithTheme(<AdrPrStatusCard pr={basePr} />);

      const link = screen.getByRole('link', { name: '#123' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://github.com/org/repo/pull/123');
    });

    it('should render PR title', () => {
      renderWithTheme(<AdrPrStatusCard pr={basePr} />);

      expect(screen.getByText('feat: Add OAuth authentication')).toBeInTheDocument();
    });

    it('should render author', () => {
      renderWithTheme(<AdrPrStatusCard pr={basePr} />);

      expect(screen.getByText(/by johndoe/)).toBeInTheDocument();
    });

    it('should render created date', () => {
      renderWithTheme(<AdrPrStatusCard pr={basePr} />);

      expect(screen.getByText(/Created Jan 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('should show Open status for open PRs', () => {
      renderWithTheme(<AdrPrStatusCard pr={basePr} />);

      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should show Closed status for closed PRs', () => {
      const closedPr: AdrPullRequest = {
        ...basePr,
        state: 'closed',
      };
      renderWithTheme(<AdrPrStatusCard pr={closedPr} />);

      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('should show Merged status for merged PRs', () => {
      const mergedPr: AdrPullRequest = {
        ...basePr,
        state: 'closed',
        merged: true,
        mergedAt: '2024-01-16T12:00:00Z',
      };
      renderWithTheme(<AdrPrStatusCard pr={mergedPr} />);

      expect(screen.getByText('Merged')).toBeInTheDocument();
    });

    it('should show merged date for merged PRs', () => {
      const mergedPr: AdrPullRequest = {
        ...basePr,
        state: 'closed',
        merged: true,
        mergedAt: '2024-01-16T12:00:00Z',
      };
      renderWithTheme(<AdrPrStatusCard pr={mergedPr} />);

      expect(screen.getByText(/Merged Jan 16, 2024/)).toBeInTheDocument();
    });
  });

  describe('external link', () => {
    it('should have external link button', () => {
      renderWithTheme(<AdrPrStatusCard pr={basePr} />);

      const externalLink = screen.getByRole('link', { name: /open in github/i });
      expect(externalLink).toHaveAttribute('href', 'https://github.com/org/repo/pull/123');
      expect(externalLink).toHaveAttribute('target', '_blank');
    });
  });
});
