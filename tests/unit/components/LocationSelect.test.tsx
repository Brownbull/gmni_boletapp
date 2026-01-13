/**
 * Tests for LocationSelect component
 *
 * Story 14.41: View Mode Edit Button & Field Locking
 * Epic 14: Core Implementation
 *
 * Tests the disabled prop functionality for read-only mode.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationSelect } from '../../../src/components/LocationSelect';

// Mock the hooks used by LocationSelect
vi.mock('../../../src/hooks/useLocations', () => ({
  useLocalizedCountries: vi.fn(() => ({
    countries: [
      { code: 'CL', names: { en: 'Chile', es: 'Chile' } },
      { code: 'US', names: { en: 'United States', es: 'Estados Unidos' } },
    ],
  })),
  useLocalizedCities: vi.fn(() => ({
    cities: [
      { id: 'santiago', names: { en: 'Santiago', es: 'Santiago' } },
      { id: 'valparaiso', names: { en: 'Valparaiso', es: 'Valparaíso' } },
    ],
  })),
  useLocationDisplay: vi.fn(() => ({
    getLocationString: (city: string, country: string) => `${city}, ${country}`,
    getCountryName: (country: string) => country,
    getCityName: (city: string) => city,
  })),
}));

vi.mock('../../../src/hooks/useIsForeignLocation', () => ({
  useIsForeignLocation: vi.fn(() => ({
    isForeign: false,
    flagEmoji: '',
  })),
}));

describe('LocationSelect', () => {
  const defaultProps = {
    country: 'Chile',
    city: 'Santiago',
    onCountryChange: vi.fn(),
    onCityChange: vi.fn(),
    inputStyle: {},
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render the location tag', () => {
      render(<LocationSelect {...defaultProps} />);

      // Should show location text
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display city and country', () => {
      render(<LocationSelect {...defaultProps} />);

      expect(screen.getByText('Santiago, Chile')).toBeInTheDocument();
    });
  });

  describe('Story 14.41: disabled prop', () => {
    it('should be enabled by default', () => {
      render(<LocationSelect {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should have normal opacity when enabled', () => {
      render(<LocationSelect {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.style.opacity).not.toBe('0.7');
    });

    it('should be disabled when disabled=true', () => {
      render(<LocationSelect {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<LocationSelect {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button.style.opacity).toBe('0.7');
    });

    it('should have default cursor when disabled', () => {
      render(<LocationSelect {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('default');
    });

    it('should have pointer cursor when enabled', () => {
      render(<LocationSelect {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button.style.cursor).toBe('pointer');
    });

    it('should not open dropdown when disabled and clicked', () => {
      render(<LocationSelect {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should not be visible (no País label visible)
      expect(screen.queryByText('País')).not.toBeInTheDocument();
    });

    it('should open dropdown when enabled and clicked', () => {
      render(<LocationSelect {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should be visible
      expect(screen.getByText('País')).toBeInTheDocument();
    });
  });

  describe('dropdown functionality when enabled', () => {
    it('should show confirm button in dropdown', () => {
      render(<LocationSelect {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('confirm')).toBeInTheDocument();
    });

    it('should close dropdown on confirm', () => {
      render(<LocationSelect {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Click confirm
      const confirmButton = screen.getByText('confirm');
      fireEvent.click(confirmButton);

      // Dropdown should be closed
      expect(screen.queryByText('País')).not.toBeInTheDocument();
    });
  });
});
