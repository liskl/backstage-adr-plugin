import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdrStatusBadge } from './AdrStatusBadge';
import { ThemeProvider } from '@material-ui/core/styles';
import { lightTheme } from '@backstage/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>,
  );
};

describe('AdrStatusBadge', () => {
  it.each([
    'draft',
    'proposed',
    'accepted',
    'rejected',
    'deprecated',
    'superseded',
  ] as const)('should render %s status', (status) => {
    renderWithTheme(<AdrStatusBadge status={status} />);

    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it('should render with small size by default', () => {
    renderWithTheme(<AdrStatusBadge status="accepted" />);

    const chip = screen.getByText('accepted').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeSmall');
  });

  it('should render with medium size when specified', () => {
    renderWithTheme(<AdrStatusBadge status="accepted" size="medium" />);

    const chip = screen.getByText('accepted').closest('.MuiChip-root');
    expect(chip).not.toHaveClass('MuiChip-sizeSmall');
  });

  it('should have correct styling for accepted status', () => {
    renderWithTheme(<AdrStatusBadge status="accepted" />);

    const chip = screen.getByText('accepted').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('should have correct styling for rejected status', () => {
    renderWithTheme(<AdrStatusBadge status="rejected" />);

    const chip = screen.getByText('rejected').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });
});
