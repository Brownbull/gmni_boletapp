/**
 * CategorySelectorOverlay Component
 *
 * Story 14.24: Full-screen category selector overlay
 *
 * Full-screen overlay for selecting categories (both transaction and item categories).
 * Similar to ImageViewer pattern - uses portal to render at document body level,
 * covers entire screen except navigation bar.
 *
 * Features:
 * - Full-screen overlay with semi-transparent background
 * - X button to cancel/close
 * - All categories displayed as clickable badges
 * - Search/filter functionality
 * - Scrollable content area
 * - Mobile-friendly touch targets (44px min)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { translateStoreCategory, translateItemGroup, ITEM_GROUP_TRANSLATIONS, getItemCategoryEmoji } from '../utils/categoryTranslations';
import { getCategoryPillColors, getItemCategoryColors } from '../config/categoryColors';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import type { Language } from '../utils/translations';

interface CategorySelectorOverlayProps {
  /** Type of selector - 'store' for transaction categories, 'item' for item categories */
  type: 'store' | 'item';
  /** Currently selected category */
  value: string;
  /** Callback when a category is selected */
  onSelect: (category: string) => void;
  /** Callback to close the overlay */
  onClose: () => void;
  /** Available categories (for store type) */
  categories?: string[];
  /** Current language for translations */
  language: Language;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Title displayed at top */
  title?: string;
}

export const CategorySelectorOverlay: React.FC<CategorySelectorOverlayProps> = ({
  type,
  value,
  onSelect,
  onClose,
  categories = [],
  language,
  theme,
  title,
}) => {
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  // Get all categories based on type
  const allCategories = useMemo(() => {
    if (type === 'store') {
      return categories.map(cat => ({
        value: cat,
        label: translateStoreCategory(cat, language),
        emoji: getCategoryEmoji(cat),
      }));
    } else {
      // Item categories from ITEM_GROUP_TRANSLATIONS
      const itemCats = Object.keys(ITEM_GROUP_TRANSLATIONS);
      return itemCats
        .map(cat => ({
          value: cat,
          label: translateItemGroup(cat, language),
          // Story 14.24: Use specific emoji for each item category
          emoji: getItemCategoryEmoji(cat),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, language === 'es' ? 'es' : 'en'));
    }
  }, [type, categories, language]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return allCategories;
    const search = searchText.toLowerCase();
    return allCategories.filter(
      cat =>
        cat.label.toLowerCase().includes(search) ||
        cat.value.toLowerCase().includes(search)
    );
  }, [allCategories, searchText]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Focus search input on mount
  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const handleSelect = (categoryValue: string) => {
    onSelect(categoryValue);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        // Cover content area but leave nav bar visible
        bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Select category'}
    >
      {/* Header with title and close button */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        }}
      >
        <h2
          className="text-lg font-semibold"
          style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
        >
          {title || (type === 'store' ? (language === 'es' ? 'Categoría' : 'Category') : (language === 'es' ? 'Categoría del Ítem' : 'Item Category'))}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full transition-colors"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Search input */}
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: isDark ? '#334155' : '#e2e8f0',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}
        >
          <Search size={18} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={language === 'es' ? 'Buscar...' : 'Search...'}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="p-1 rounded-full"
              style={{ color: isDark ? '#64748b' : '#94a3b8' }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories grid */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
      >
        {filteredCategories.length === 0 ? (
          <div
            className="text-center py-8"
            style={{ color: isDark ? '#64748b' : '#94a3b8' }}
          >
            {language === 'es' ? 'Sin resultados' : 'No results'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map(cat => {
              const isSelected = cat.value === value;
              // Story 14.24: Use individual category colors (not group colors) for distinct appearance
              const colors = type === 'store'
                ? getCategoryPillColors(cat.value)
                : getItemCategoryColors(cat.value, 'normal', isDark ? 'dark' : 'light');

              return (
                <button
                  key={cat.value}
                  onClick={() => handleSelect(cat.value)}
                  className="rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase flex items-center gap-1 transition-all min-h-[36px]"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.fg,
                    outline: isSelected ? '2px solid var(--primary)' : 'none',
                    outlineOffset: '1px',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  <span className="text-xs">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
