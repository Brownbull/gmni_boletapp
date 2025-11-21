import React from 'react';
import { getColor } from '../utils/colors';

interface CategoryBadgeProps {
    category: string;
    subcategory?: string;
    mini?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, subcategory, mini }) => (
    <div className="flex flex-wrap gap-1">
        <span
            className={`rounded-md font-bold uppercase text-white ${mini ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'}`}
            style={{ backgroundColor: getColor(category) }}
        >
            {category}
        </span>
        {subcategory && (
            <span
                className={`rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate ${mini ? 'px-1.5 py-0.5 text-[8px] max-w-[60px]' : 'px-2 py-0.5 text-[10px] max-w-[120px]'}`}
            >
                {subcategory}
            </span>
        )}
    </div>
);
