import React from 'react';
import { BookMarked } from 'lucide-react';
import { getColor } from '../utils/colors';
import type { CategorySource } from '../types/transaction';

interface CategoryBadgeProps {
    category: string;
    subcategory?: string;
    mini?: boolean;
    /** Source of the category (scan, learned, user) - shows indicator if 'learned' */
    categorySource?: CategorySource;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, subcategory, mini, categorySource }) => (
    <div className="flex flex-wrap gap-1 items-center">
        <span
            className={`rounded-md font-bold uppercase text-white ${mini ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'}`}
            style={{ backgroundColor: getColor(category) }}
        >
            {category}
        </span>
        {categorySource === 'learned' && (
            <span
                className={`inline-flex items-center gap-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 ${mini ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'}`}
                title="Auto-categorized from learned preference"
            >
                <BookMarked size={mini ? 8 : 10} />
                <span className="sr-only">Learned</span>
            </span>
        )}
        {subcategory && (
            <span
                className={`rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate ${mini ? 'px-1.5 py-0.5 text-[8px] max-w-[60px]' : 'px-2 py-0.5 text-[10px] max-w-[120px]'}`}
            >
                {subcategory}
            </span>
        )}
    </div>
);
