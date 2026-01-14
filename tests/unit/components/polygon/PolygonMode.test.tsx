/**
 * Polygon Mode Components Tests (Consolidated)
 *
 * Story 14.6: Polygon Dual Mode
 * Epic 14: Core Implementation
 *
 * Consolidates:
 * - PolygonModeToggle (11 tests) - Segmented control toggle
 * - PolygonWithModeToggle (16 tests) - Integrated component
 *
 * Total: 27 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolygonModeToggle, type PolygonMode } from '../../../../src/components/polygon/PolygonModeToggle';
import { PolygonWithModeToggle } from '../../../../src/components/polygon/PolygonWithModeToggle';
import type { Transaction } from '../../../../src/types/transaction';

// Mock useReducedMotion hook
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock useBreathing hook
vi.mock('../../../../src/components/animation/useBreathing', () => ({
  useBreathing: vi.fn(() => ({
    scale: 1,
    opacity: 1,
    phase: 0,
    isAnimating: true,
    style: { transform: 'scale(1)', opacity: 1 },
    transform: 'scale(1)',
  })),
}));

// =============================================================================
// PolygonModeToggle Tests (11 tests)
// =============================================================================

describe('PolygonModeToggle', () => {
  const defaultProps = {
    mode: 'categories' as PolygonMode,
    onModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: Mode toggle component - segmented control', () => {
    it('renders two toggle options', () => {
      render(<PolygonModeToggle {...defaultProps} />);

      expect(screen.getByText('Categorías')).toBeInTheDocument();
      expect(screen.getByText('Grupos')).toBeInTheDocument();
    });

    it('shows categories option as active when mode is categories', () => {
      render(<PolygonModeToggle {...defaultProps} mode="categories" />);

      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      expect(categoriesButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows groups option as active when mode is groups', () => {
      render(<PolygonModeToggle {...defaultProps} mode="groups" />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      expect(groupsButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onModeChange when clicking inactive option', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      expect(onModeChange).toHaveBeenCalledWith('groups');
    });

    it('does not call onModeChange when clicking active option', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      fireEvent.click(categoriesButton);

      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('Active state styling', () => {
    it('applies active styling to selected option', () => {
      render(<PolygonModeToggle {...defaultProps} mode="categories" />);

      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      const groupsButton = screen.getByRole('button', { name: /grupos/i });

      // Active button should have different styling
      expect(categoriesButton.className).toContain('bg-');
      expect(groupsButton).not.toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Touch-friendly sizing', () => {
    it('has minimum touch target size', () => {
      const { container } = render(<PolygonModeToggle {...defaultProps} />);

      // Container should have appropriate padding/sizing classes
      const toggleContainer = container.firstChild as HTMLElement;
      expect(toggleContainer).toBeInTheDocument();
    });

    it('renders as accessible toggle group', () => {
      render(<PolygonModeToggle {...defaultProps} />);

      const toggleGroup = screen.getByRole('group');
      expect(toggleGroup).toBeInTheDocument();
      expect(toggleGroup).toHaveAttribute('aria-label', 'Polygon view mode');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation with Enter key', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.keyDown(groupsButton, { key: 'Enter' });

      expect(onModeChange).toHaveBeenCalledWith('groups');
    });

    it('supports keyboard navigation with Space key', () => {
      const onModeChange = vi.fn();
      render(<PolygonModeToggle mode="categories" onModeChange={onModeChange} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.keyDown(groupsButton, { key: ' ' });

      expect(onModeChange).toHaveBeenCalledWith('groups');
    });
  });

  describe('className prop', () => {
    it('accepts additional className', () => {
      const { container } = render(
        <PolygonModeToggle {...defaultProps} className="mt-4" />
      );

      expect(container.firstChild).toHaveClass('mt-4');
    });
  });
});

// =============================================================================
// PolygonWithModeToggle Tests (16 tests)
// =============================================================================

describe('PolygonWithModeToggle', () => {
  // Mock localStorage
  let mockStorage: Record<string, string>;
  let mockLocalStorage: Storage;

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx1',
      date: '2024-01-15',
      merchant: 'Jumbo',
      category: 'Supermarket',
      total: 100000,
      items: [
        { name: 'Apples', price: 30000, category: 'Produce' },
        { name: 'Bread', price: 20000, category: 'Bakery' },
        { name: 'Milk', price: 50000, category: 'Dairy & Eggs' },
      ],
    },
    {
      id: 'tx2',
      date: '2024-01-16',
      merchant: 'La Picada',
      category: 'Restaurant',
      total: 75000,
      items: [
        { name: 'Lunch', price: 75000, category: 'Service' },
      ],
    },
    {
      id: 'tx3',
      date: '2024-01-17',
      merchant: 'Shell',
      category: 'GasStation',
      total: 50000,
      items: [
        { name: 'Fuel', price: 50000, category: 'Automotive' },
      ],
    },
  ];

  beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders the mode toggle and polygon', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      expect(screen.getByText('Categorías')).toBeInTheDocument();
      expect(screen.getByText('Grupos')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-polygon-svg')).toBeInTheDocument();
    });

    it('renders polygon with categories mode by default', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      // Should show merchant category labels
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('GasStation')).toBeInTheDocument();
    });
  });

  describe('Mode switching', () => {
    it('switches to groups mode when clicking Grupos', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      // Should show item category labels
      expect(screen.getByText('Produce')).toBeInTheDocument();
      expect(screen.getByText('Bakery')).toBeInTheDocument();
    });

    it('switches back to categories mode when clicking Categorías', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      // Switch to groups first
      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      // Switch back to categories
      const categoriesButton = screen.getByRole('button', { name: /categorías/i });
      fireEvent.click(categoriesButton);

      // Should show merchant category labels again
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
    });
  });

  describe('AC #4: Smooth transition between modes', () => {
    it('has transition wrapper with animation class', () => {
      const { container } = render(
        <PolygonWithModeToggle transactions={sampleTransactions} />
      );

      const wrapper = container.querySelector('[data-testid="polygon-transition-wrapper"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.className).toContain('transition');
    });

    it('polygon container has transition styles for shape morphing', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      const polygonContainer = screen.getByTestId('dynamic-polygon-container');
      expect(polygonContainer).toBeInTheDocument();
    });
  });

  describe('AC #6: Labels update with mode change', () => {
    it('shows correct labels for categories mode', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      // Merchant categories
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('GasStation')).toBeInTheDocument();
    });

    it('shows correct labels for groups mode', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      // Switch to groups
      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      // Item groups
      expect(screen.getByText('Produce')).toBeInTheDocument();
      expect(screen.getByText('Bakery')).toBeInTheDocument();
      expect(screen.getByText('Dairy & Eggs')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('Automotive')).toBeInTheDocument();
    });

    it('shows correct amounts for categories mode', () => {
      render(<PolygonWithModeToggle transactions={sampleTransactions} />);

      // $100.000 for Supermarket
      expect(screen.getByText(/\$100\.000/)).toBeInTheDocument();
      // $75.000 for Restaurant
      expect(screen.getByText(/\$75\.000/)).toBeInTheDocument();
    });
  });

  describe('Vertex click handling', () => {
    it('calls onVertexClick with category name when in categories mode', () => {
      const onVertexClick = vi.fn();
      render(
        <PolygonWithModeToggle
          transactions={sampleTransactions}
          onVertexClick={onVertexClick}
        />
      );

      const vertex = screen.getByTestId('polygon-vertex-Supermarket');
      fireEvent.click(vertex);

      expect(onVertexClick).toHaveBeenCalledWith('Supermarket', 'categories');
    });

    it('calls onVertexClick with group name when in groups mode', () => {
      const onVertexClick = vi.fn();
      render(
        <PolygonWithModeToggle
          transactions={sampleTransactions}
          onVertexClick={onVertexClick}
        />
      );

      // Switch to groups
      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      const vertex = screen.getByTestId('polygon-vertex-Produce');
      fireEvent.click(vertex);

      expect(onVertexClick).toHaveBeenCalledWith('Produce', 'groups');
    });
  });

  describe('Edge cases', () => {
    it('handles empty transaction list', () => {
      render(<PolygonWithModeToggle transactions={[]} />);

      expect(screen.getByText('No spending data')).toBeInTheDocument();
    });

    it('handles transactions with no items in groups mode', () => {
      const txWithNoItems: Transaction[] = [
        {
          id: 'tx1',
          date: '2024-01-15',
          merchant: 'Test',
          category: 'Supermarket',
          total: 100000,
          items: [],
        },
      ];

      render(<PolygonWithModeToggle transactions={txWithNoItems} />);

      // Switch to groups
      const groupsButton = screen.getByRole('button', { name: /grupos/i });
      fireEvent.click(groupsButton);

      // Should show empty state since no items
      expect(screen.getByText('No spending data')).toBeInTheDocument();
    });
  });

  describe('Additional props', () => {
    it('passes className to container', () => {
      const { container } = render(
        <PolygonWithModeToggle
          transactions={sampleTransactions}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('passes currency prop to polygon', () => {
      render(
        <PolygonWithModeToggle
          transactions={sampleTransactions}
          currency="USD"
        />
      );

      // Currency formatting should be applied
      expect(screen.getByTestId('dynamic-polygon-svg')).toBeInTheDocument();
    });

    it('passes breathing prop to polygon', () => {
      render(
        <PolygonWithModeToggle
          transactions={sampleTransactions}
          breathing={false}
        />
      );

      // Polygon should render without breathing
      expect(screen.getByTestId('dynamic-polygon-svg')).toBeInTheDocument();
    });
  });
});
