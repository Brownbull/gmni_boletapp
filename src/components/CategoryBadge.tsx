import React from 'react';
import { BookMarked } from 'lucide-react';
// Story 14.21: Use getCategoryPillColors for badges - always colorful regardless of fontColorMode
import { getCategoryPillColors } from '../config/categoryColors';
import { translateCategory, translateSubcategory } from '../utils/categoryTranslations';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import type { CategorySource } from '../types/transaction';
import type { Language } from '../utils/translations';

interface CategoryBadgeProps {
    category: string;
    subcategory?: string;
    mini?: boolean;
    /** Source of the category (scan, learned, user) - shows indicator if 'learned' */
    categorySource?: CategorySource;
    /** Source of the subcategory (scan, learned, user) - shows indicator if 'learned' - Story 9.15 */
    subcategorySource?: CategorySource;
    /** Language for translation (defaults to 'en') - Story 9.12 AC #5 */
    lang?: Language;
    /** Story 14.15: Show emoji icon inside badge */
    showIcon?: boolean;
    /** Story 14.15: Maximum width for text truncation (default: no max) */
    maxWidth?: string;
}

/**
 * CategoryBadge Component
 *
 * Displays category and subcategory badges with optional translation support.
 * Story 9.12: Added lang prop for UI content translation (AC #5).
 * Story 9.15: Added subcategorySource prop for learned subcategory indicator.
 * Colors are based on the English (canonical) category key.
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
    category,
    subcategory,
    mini,
    categorySource,
    subcategorySource,
    lang = 'en',
    showIcon = false,
    maxWidth,
}) => {
    // Translate category and subcategory for display (AC #5)
    const displayCategory = translateCategory(category, lang);
    const displaySubcategory = subcategory ? translateSubcategory(subcategory, lang) : undefined;
    const emoji = getCategoryEmoji(category);

    return (
        <div className="flex flex-wrap gap-1 items-center">
            <span
                className={`rounded-full font-bold uppercase flex items-center gap-1 ${mini ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[10px]'}`}
                // Story 14.21: Pills/badges always use colorful colors (not affected by fontColorMode)
                style={{
                    backgroundColor: getCategoryPillColors(category).bg,
                    color: getCategoryPillColors(category).fg,
                    maxWidth: maxWidth,
                }}
            >
                {showIcon && <span className={mini ? 'text-[10px]' : 'text-xs'}>{emoji}</span>}
                <span className={maxWidth ? 'truncate' : ''}>{displayCategory}</span>
            </span>
            {categorySource === 'learned' && (
                <span
                    className={`inline-flex items-center gap-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 ${mini ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'}`}
                    title="Auto-categorized from learned preference"
                >
                    <BookMarked size={mini ? 8 : 10} />
                    <span className="sr-only">Learned category</span>
                </span>
            )}
            {displaySubcategory && (
                <span
                    className={`rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate ${mini ? 'px-1.5 py-0.5 text-[8px] max-w-[60px]' : 'px-2 py-0.5 text-[10px] max-w-[120px]'}`}
                >
                    {displaySubcategory}
                </span>
            )}
            {subcategorySource === 'learned' && displaySubcategory && (
                <span
                    className={`inline-flex items-center gap-0.5 rounded-md bg-green-100 text-green-700 border border-green-200 ${mini ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'}`}
                    title="Subcategory auto-applied from learned preference"
                >
                    <BookMarked size={mini ? 8 : 10} />
                    <span className="sr-only">Learned subcategory</span>
                </span>
            )}
        </div>
    );
};
