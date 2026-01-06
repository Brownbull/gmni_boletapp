/**
 * DatosAprendidosView Sub-View
 * Story 14.22 AC #8, #11, #12: Learned data management
 *
 * Displays expandable sections for learned categories, merchants, subcategories, and trusted merchants
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookMarked, Store, Tag, Handshake } from 'lucide-react';
import { CategoryMappingsList } from '../../CategoryMappingsList';
import { MerchantMappingsList } from '../../MerchantMappingsList';
import { SubcategoryMappingsList } from '../../SubcategoryMappingsList';
import { TrustedMerchantsList } from '../../TrustedMerchantsList';
import type { CategoryMapping } from '../../../types/categoryMapping';
import type { MerchantMapping } from '../../../types/merchantMapping';
import type { SubcategoryMapping } from '../../../types/subcategoryMapping';
import type { TrustedMerchant } from '../../../types/trust';

interface DatosAprendidosViewProps {
    t: (key: string) => string;
    theme: string;
    // Category mappings
    mappings?: CategoryMapping[];
    mappingsLoading?: boolean;
    onDeleteMapping?: (mappingId: string) => Promise<void>;
    onEditMapping?: (mappingId: string, newCategory: string) => Promise<void>;
    // Merchant mappings
    merchantMappings?: MerchantMapping[];
    merchantMappingsLoading?: boolean;
    onDeleteMerchantMapping?: (mappingId: string) => Promise<void>;
    onEditMerchantMapping?: (mappingId: string, newTarget: string) => Promise<void>;
    // Subcategory mappings
    subcategoryMappings?: SubcategoryMapping[];
    subcategoryMappingsLoading?: boolean;
    onDeleteSubcategoryMapping?: (mappingId: string) => Promise<void>;
    onUpdateSubcategoryMapping?: (mappingId: string, newSubcategory: string) => Promise<void>;
    // Trusted merchants
    trustedMerchants?: TrustedMerchant[];
    trustedMerchantsLoading?: boolean;
    onRevokeTrust?: (merchantName: string) => Promise<void>;
}

interface ExpandableSectionProps {
    title: string;
    icon: React.ReactNode;
    iconBgColor: string;
    count: number;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    theme: string;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
    title,
    icon,
    iconBgColor,
    count,
    isExpanded,
    onToggle,
    children,
    theme,
}) => {
    const isDark = theme === 'dark';

    return (
        <div
            className="rounded-xl border overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: isDark ? '#334155' : '#e2e8f0',
            }}
        >
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between"
                style={{ backgroundColor: 'transparent' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: iconBgColor }}
                    >
                        {icon}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                            backgroundColor: isDark ? '#334155' : '#e2e8f0',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {count}
                    </span>
                    {isExpanded ? (
                        <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} />
                    ) : (
                        <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                </div>
            </button>

            {/* Content */}
            {isExpanded && (
                <div
                    className="px-4 pb-4 pt-0"
                    style={{ borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export const DatosAprendidosView: React.FC<DatosAprendidosViewProps> = ({
    t,
    theme,
    mappings = [],
    mappingsLoading = false,
    onDeleteMapping,
    onEditMapping,
    merchantMappings = [],
    merchantMappingsLoading = false,
    onDeleteMerchantMapping,
    onEditMerchantMapping,
    subcategoryMappings = [],
    subcategoryMappingsLoading = false,
    onDeleteSubcategoryMapping,
    onUpdateSubcategoryMapping,
    trustedMerchants = [],
    trustedMerchantsLoading = false,
    onRevokeTrust,
}) => {
    // Expansion state for each section
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        categories: false,
        merchants: false,
        subcategories: false,
        trusted: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="space-y-4">
            {/* Learned Categories */}
            {onDeleteMapping && (
                <ExpandableSection
                    title={t('learnedCategories')}
                    icon={<BookMarked size={20} color="#ffffff" />}
                    iconBgColor="var(--accent, #3b82f6)"
                    count={mappings.length}
                    isExpanded={expandedSections.categories}
                    onToggle={() => toggleSection('categories')}
                    theme={theme}
                >
                    <CategoryMappingsList
                        mappings={mappings}
                        loading={mappingsLoading}
                        onDeleteMapping={onDeleteMapping}
                        onEditMapping={onEditMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                </ExpandableSection>
            )}

            {/* Learned Merchants */}
            {onDeleteMerchantMapping && onEditMerchantMapping && (
                <ExpandableSection
                    title={t('learnedMerchants')}
                    icon={<Store size={20} color="#ffffff" />}
                    iconBgColor="#f59e0b"
                    count={merchantMappings.length}
                    isExpanded={expandedSections.merchants}
                    onToggle={() => toggleSection('merchants')}
                    theme={theme}
                >
                    <MerchantMappingsList
                        mappings={merchantMappings}
                        loading={merchantMappingsLoading}
                        onDeleteMapping={onDeleteMerchantMapping}
                        onEditMapping={onEditMerchantMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                </ExpandableSection>
            )}

            {/* Learned Subcategories */}
            {onDeleteSubcategoryMapping && onUpdateSubcategoryMapping && (
                <ExpandableSection
                    title={t('learnedSubcategories')}
                    icon={<Tag size={20} color="#ffffff" />}
                    iconBgColor="#10b981"
                    count={subcategoryMappings.length}
                    isExpanded={expandedSections.subcategories}
                    onToggle={() => toggleSection('subcategories')}
                    theme={theme}
                >
                    <SubcategoryMappingsList
                        mappings={subcategoryMappings}
                        loading={subcategoryMappingsLoading}
                        onDeleteMapping={onDeleteSubcategoryMapping}
                        onUpdateMapping={onUpdateSubcategoryMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                </ExpandableSection>
            )}

            {/* Trusted Merchants */}
            {onRevokeTrust && (
                <ExpandableSection
                    title={t('trustedMerchants')}
                    icon={<Handshake size={20} color="#ffffff" />}
                    iconBgColor="#8b5cf6"
                    count={trustedMerchants.length}
                    isExpanded={expandedSections.trusted}
                    onToggle={() => toggleSection('trusted')}
                    theme={theme}
                >
                    <TrustedMerchantsList
                        merchants={trustedMerchants}
                        loading={trustedMerchantsLoading}
                        onRevokeTrust={onRevokeTrust}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                </ExpandableSection>
            )}
        </div>
    );
};
