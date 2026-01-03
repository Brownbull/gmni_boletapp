/**
 * PolygonWithModeToggle Component Tests
 *
 * Story 14.6: Polygon Dual Mode
 * Epic 14: Core Implementation
 *
 * Tests for the integrated component that combines
 * DynamicPolygon with mode toggle and data aggregation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock localStorage
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

describe('PolygonWithModeToggle', () => {
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
