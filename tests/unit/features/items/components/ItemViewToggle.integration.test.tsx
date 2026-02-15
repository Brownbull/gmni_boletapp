/**
 * ItemViewToggle Integration Tests
 *
 * Story 14.38: Item View Toggle - Grouped vs Original Order
 * @see docs/sprint-artifacts/epic14/stories/story-14.38-item-view-toggle.md
 *
 * Integration tests verifying toggle behavior with item data
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ItemViewToggle, type ItemViewMode } from '../../../../src/components/items/ItemViewToggle';

// Wrapper component to test state changes
const TestToggleWrapper: React.FC<{
  initialView?: ItemViewMode;
  onViewChange?: (view: ItemViewMode) => void;
}> = ({ initialView = 'grouped', onViewChange }) => {
  const [activeView, setActiveView] = useState<ItemViewMode>(initialView);

  const handleViewChange = (view: ItemViewMode) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const t = (key: string) => {
    const translations: Record<string, string> = {
      byGroup: 'Por Grupo',
      originalOrder: 'Original',
      itemViewModes: 'Item view modes',
    };
    return translations[key] || key;
  };

  return (
    <div>
      <ItemViewToggle activeView={activeView} onViewChange={handleViewChange} t={t} />
      <div data-testid="current-view">{activeView}</div>
    </div>
  );
};

describe('ItemViewToggle Integration', () => {
  describe('State Management (AC4)', () => {
    it('maintains local state when toggling views', () => {
      render(<TestToggleWrapper initialView="grouped" />);

      expect(screen.getByTestId('current-view')).toHaveTextContent('grouped');

      fireEvent.click(screen.getByRole('tab', { name: /original/i }));
      expect(screen.getByTestId('current-view')).toHaveTextContent('original');

      fireEvent.click(screen.getByRole('tab', { name: /por grupo/i }));
      expect(screen.getByTestId('current-view')).toHaveTextContent('grouped');
    });

    it('starts with grouped view by default', () => {
      render(<TestToggleWrapper />);

      const groupedTab = screen.getByRole('tab', { name: /por grupo/i });
      expect(groupedTab).toHaveAttribute('aria-selected', 'true');
    });

    it('calls onViewChange callback when view changes', () => {
      const mockOnChange = vi.fn();
      render(<TestToggleWrapper onViewChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /original/i }));

      expect(mockOnChange).toHaveBeenCalledWith('original');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('persists view selection across multiple toggles', () => {
      const mockOnChange = vi.fn();
      render(<TestToggleWrapper onViewChange={mockOnChange} />);

      // Toggle to original
      fireEvent.click(screen.getByRole('tab', { name: /original/i }));
      expect(screen.getByTestId('current-view')).toHaveTextContent('original');

      // Toggle back to grouped
      fireEvent.click(screen.getByRole('tab', { name: /por grupo/i }));
      expect(screen.getByTestId('current-view')).toHaveTextContent('grouped');

      // Toggle to original again
      fireEvent.click(screen.getByRole('tab', { name: /original/i }));
      expect(screen.getByTestId('current-view')).toHaveTextContent('original');

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual Design (AC5)', () => {
    it('has smooth transition animation class', () => {
      const { container } = render(<TestToggleWrapper />);

      // The sliding indicator should have transition classes
      const indicator = container.querySelector('.transition-all');
      expect(indicator).toBeInTheDocument();
    });

    it('uses theme CSS variables', () => {
      const { container } = render(<TestToggleWrapper />);

      const tablist = container.querySelector('[role="tablist"]');
      // Should use bg-tertiary for container
      expect(tablist).toHaveStyle({ backgroundColor: 'var(--bg-tertiary, #f1f5f9)' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for tabs', () => {
      render(<TestToggleWrapper />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Item view modes');

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      // First tab should be selected
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('updates ARIA selected on view change', () => {
      render(<TestToggleWrapper />);

      const tabs = screen.getAllByRole('tab');

      // Initial state
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      // Click original
      fireEvent.click(tabs[1]);

      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Bilingual Support', () => {
    it('renders with Spanish translations (default)', () => {
      render(<TestToggleWrapper />);

      expect(screen.getByRole('tab', { name: /por grupo/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /original/i })).toBeInTheDocument();
    });

    it('renders with English translations', () => {
      const englishT = (key: string) => {
        const translations: Record<string, string> = {
          byGroup: 'By Group',
          originalOrder: 'Original',
          itemViewModes: 'Item view modes',
        };
        return translations[key] || key;
      };

      render(
        <ItemViewToggle
          activeView="grouped"
          onViewChange={() => {}}
          t={englishT}
        />
      );

      expect(screen.getByRole('tab', { name: /by group/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /original/i })).toBeInTheDocument();
    });
  });
});

describe('ItemViewToggle with Mock Items Data', () => {
  // Test component simulating real editor behavior
  const TestEditorWithToggle: React.FC<{
    items: Array<{ name: string; price: number; category: string }>;
  }> = ({ items }) => {
    const [activeView, setActiveView] = useState<ItemViewMode>('grouped');

    const t = (key: string) => {
      const translations: Record<string, string> = {
        byGroup: 'By Group',
        originalOrder: 'Original',
        itemViewModes: 'Item view modes',
      };
      return translations[key] || key;
    };

    // Group items by category (simplified)
    const groupedItems = items.reduce((acc, item) => {
      const group = item.category || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    return (
      <div>
        {items.length > 0 && (
          <ItemViewToggle activeView={activeView} onViewChange={setActiveView} t={t} />
        )}

        {activeView === 'grouped' && (
          <div data-testid="grouped-view">
            {Object.entries(groupedItems).map(([group, groupItems]) => (
              <div key={group} data-testid={`group-${group}`}>
                <h3>{group}</h3>
                {groupItems.map((item, i) => (
                  <div key={i} data-testid={`grouped-item-${i}`}>
                    {item.name} - ${item.price}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeView === 'original' && (
          <div data-testid="original-view">
            {items.map((item, i) => (
              <div key={i} data-testid={`original-item-${i}`}>
                <span data-testid="item-index">{i + 1}.</span>
                {item.name} - ${item.price}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const mockItems = [
    { name: 'Apple', price: 1.99, category: 'Produce' },
    { name: 'Milk', price: 3.49, category: 'Dairy' },
    { name: 'Bread', price: 2.99, category: 'Bakery' },
    { name: 'Banana', price: 0.99, category: 'Produce' },
    { name: 'Cheese', price: 4.99, category: 'Dairy' },
  ];

  it('shows grouped view by default', () => {
    render(<TestEditorWithToggle items={mockItems} />);

    expect(screen.getByTestId('grouped-view')).toBeInTheDocument();
    expect(screen.queryByTestId('original-view')).not.toBeInTheDocument();
  });

  it('switches to original view when toggle is clicked', () => {
    render(<TestEditorWithToggle items={mockItems} />);

    fireEvent.click(screen.getByRole('tab', { name: /original/i }));

    expect(screen.queryByTestId('grouped-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('original-view')).toBeInTheDocument();
  });

  it('shows item index numbers in original view (AC2)', () => {
    render(<TestEditorWithToggle items={mockItems} />);

    fireEvent.click(screen.getByRole('tab', { name: /original/i }));

    const originalView = screen.getByTestId('original-view');
    const indices = within(originalView).getAllByTestId('item-index');

    expect(indices).toHaveLength(5);
    expect(indices[0]).toHaveTextContent('1.');
    expect(indices[1]).toHaveTextContent('2.');
    expect(indices[2]).toHaveTextContent('3.');
    expect(indices[3]).toHaveTextContent('4.');
    expect(indices[4]).toHaveTextContent('5.');
  });

  it('maintains original order in original view (AC2)', () => {
    render(<TestEditorWithToggle items={mockItems} />);

    fireEvent.click(screen.getByRole('tab', { name: /original/i }));

    const item0 = screen.getByTestId('original-item-0');
    const item1 = screen.getByTestId('original-item-1');
    const item2 = screen.getByTestId('original-item-2');

    expect(item0).toHaveTextContent('Apple');
    expect(item1).toHaveTextContent('Milk');
    expect(item2).toHaveTextContent('Bread');
  });

  it('groups items by category in grouped view (AC3)', () => {
    render(<TestEditorWithToggle items={mockItems} />);

    // Should have groups for Produce, Dairy, Bakery
    expect(screen.getByTestId('group-Produce')).toBeInTheDocument();
    expect(screen.getByTestId('group-Dairy')).toBeInTheDocument();
    expect(screen.getByTestId('group-Bakery')).toBeInTheDocument();
  });

  it('hides toggle when no items', () => {
    render(<TestEditorWithToggle items={[]} />);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('shows toggle when items exist', () => {
    render(<TestEditorWithToggle items={mockItems} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
