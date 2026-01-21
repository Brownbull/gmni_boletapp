/**
 * NotificationsList Component
 *
 *
 * Displays a list of in-app notifications with:
 * - Long-press to enter selection mode (like transactions view)
 * - Selection bar with Select All toggle and Delete button
 * - Swipe-to-delete for individual notifications
 *
 * Notification card layout:
 * - Left: Group icon/emoji in colored circle
 * - Top-right: Bookmark icon (no background, indicates group notification)
 * - Title: Group name (text only)
 * - Body: Notification message
 * - Bottom-right: Arrow icon and time
 */

import React, { useState, useRef, useCallback } from 'react';
import { Bookmark, ArrowRight, Trash2, X, CheckSquare } from 'lucide-react';
import type { InAppNotificationClient } from '../../types/notification';
import type { SharedGroup } from '../../types/sharedGroup';

// ============================================================================
// Types
// ============================================================================

interface NotificationsListProps {
    notifications: InAppNotificationClient[];
    groups: SharedGroup[];
    onNotificationClick: (notification: InAppNotificationClient) => void;
    onMarkAsRead: (notificationId: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (notificationId: string) => void;
    onDeleteAll: () => void;
    t: (key: string) => string;
    lang?: 'en' | 'es';
}

interface NotificationItemProps {
    notification: InAppNotificationClient;
    groupColor?: string;
    groupIcon?: string;
    isSelectionMode: boolean;
    isSelected: boolean;
    onNotificationClick: (notification: InAppNotificationClient) => void;
    onMarkAsRead: (notificationId: string) => void;
    onDelete: (notificationId: string) => void;
    onLongPress: () => void;
    onToggleSelect: (id: string) => void;
    t: (key: string) => string;
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum swipe distance to trigger delete (pixels) */
const SWIPE_THRESHOLD = 80;

/** Animation duration for slide out (ms) */
const SLIDE_OUT_DURATION = 200;

/** Default group color if none specified */
const DEFAULT_GROUP_COLOR = '#10b981';

/** Long press duration to enter selection mode (ms) */
const LONG_PRESS_DURATION = 500;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format notification time relative to now
 */
function formatRelativeTime(date: Date, t: (key: string) => string): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins} ${t('minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('hoursAgo')}`;
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo').replace('{days}', String(diffDays));

    return date.toLocaleDateString();
}

// ============================================================================
// Selection Bar Component
// ============================================================================

interface NotificationSelectionBarProps {
    selectedCount: number;
    totalCount: number;
    onClose: () => void;
    onSelectAll: () => void;
    onDelete: () => void;
    t: (key: string) => string;
    lang: 'en' | 'es';
}

function NotificationSelectionBar({
    selectedCount,
    totalCount,
    onClose,
    onSelectAll,
    onDelete,
    t,
    lang,
}: NotificationSelectionBarProps) {
    const allSelected = totalCount > 0 && selectedCount === totalCount;

    const getSelectionText = () => {
        if (lang === 'es') {
            return selectedCount === 1
                ? '1 seleccionado'
                : `${selectedCount} seleccionados`;
        }
        return selectedCount === 1
            ? '1 selected'
            : `${selectedCount} selected`;
    };

    return (
        <div
            className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
            style={{ backgroundColor: 'var(--primary)' }}
        >
            {/* Left: Close + count */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                    <X size={18} strokeWidth={2.5} style={{ color: 'white' }} />
                </button>
                <span className="text-sm font-medium" style={{ color: 'white' }}>
                    {getSelectionText()}
                </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Select All / None toggle */}
                <button
                    onClick={onSelectAll}
                    className="flex flex-col items-center gap-0.5"
                >
                    <CheckSquare
                        size={20}
                        strokeWidth={1.8}
                        style={{ color: 'white' }}
                        fill={allSelected ? 'rgba(255, 255, 255, 0.3)' : 'none'}
                    />
                    <span
                        className="text-xs font-medium"
                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                        {allSelected ? t('none') : t('selectAll')}
                    </span>
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    disabled={selectedCount === 0}
                    className="flex flex-col items-center gap-0.5 disabled:opacity-40"
                >
                    <Trash2 size={20} strokeWidth={1.8} style={{ color: 'white' }} />
                    <span
                        className="text-xs font-medium"
                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                        {t('delete')}
                    </span>
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Notification Item Component
// ============================================================================

function NotificationItem({
    notification,
    groupColor,
    groupIcon,
    isSelectionMode,
    isSelected,
    onNotificationClick,
    onMarkAsRead,
    onDelete,
    onLongPress,
    onToggleSelect,
    t,
}: NotificationItemProps) {
    const [offsetX, setOffsetX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const startXRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (isSelectionMode) return;

        startXRef.current = e.touches[0].clientX;
        isLongPressRef.current = false;

        // Start long press timer
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            onLongPress();
        }, LONG_PRESS_DURATION);
    }, [isSelectionMode, onLongPress]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        // Cancel long press if moving
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (isSelectionMode || startXRef.current === null) return;

        const currentX = e.touches[0].clientX;
        const diff = startXRef.current - currentX;

        if (diff > 0) {
            setOffsetX(Math.min(diff, 120));
        } else {
            setOffsetX(0);
        }
    }, [isSelectionMode]);

    const handleTouchEnd = useCallback(() => {
        // Clear long press timer
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (isSelectionMode) return;

        if (offsetX > SWIPE_THRESHOLD) {
            setIsDeleting(true);
            setOffsetX(containerRef.current?.offsetWidth || 300);
            setTimeout(() => {
                onDelete(notification.id);
            }, SLIDE_OUT_DURATION);
        } else {
            setOffsetX(0);
        }
        startXRef.current = null;
    }, [isSelectionMode, offsetX, notification.id, onDelete]);

    const handleClick = useCallback(() => {
        if (isLongPressRef.current) return;

        if (isSelectionMode) {
            onToggleSelect(notification.id);
            return;
        }

        if (offsetX < 10) {
            if (!notification.read) {
                onMarkAsRead(notification.id);
            }
            onNotificationClick(notification);
        }
    }, [isSelectionMode, offsetX, notification, onMarkAsRead, onNotificationClick, onToggleSelect]);

    const accentColor = groupColor || DEFAULT_GROUP_COLOR;
    const displayIcon = notification.groupIcon || groupIcon;

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden"
            style={{
                opacity: isDeleting ? 0 : 1,
                transition: isDeleting ? `opacity ${SLIDE_OUT_DURATION}ms ease-out` : undefined,
            }}
        >
            {/* Delete background - only visible when swiping */}
            {offsetX > 0 && !isSelectionMode && (
                <div
                    className="absolute inset-y-0 right-0 flex items-center justify-end px-4"
                    style={{ backgroundColor: '#ef4444', width: '120px' }}
                >
                    <Trash2 size={20} color="white" />
                </div>
            )}

            {/* Notification content - full width, no rounded corners */}
            <div
                className="relative w-full text-left px-4 py-3 transition-transform"
                style={{
                    transform: isSelectionMode ? 'none' : `translateX(-${offsetX}px)`,
                    transition: startXRef.current === null ? 'transform 0.2s ease-out' : 'none',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                    borderBottomWidth: '1px',
                    borderBottomColor: 'var(--border-light)',
                    borderLeftWidth: '4px',
                    borderLeftColor: accentColor,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleClick}
            >
                <div className="flex items-center gap-3">
                    {/* Left: Group icon in colored circle OR selection checkbox - vertically centered */}
                    <div
                        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: isSelected ? 'var(--primary)' : accentColor,
                            fontSize: displayIcon ? '1.25rem' : undefined,
                        }}
                    >
                        {isSelectionMode ? (
                            isSelected ? (
                                <CheckSquare size={20} style={{ color: 'white' }} fill="white" />
                            ) : (
                                <div
                                    className="w-5 h-5 rounded border-2 bg-white/20"
                                    style={{ borderColor: 'white' }}
                                />
                            )
                        ) : displayIcon ? (
                            <span>{displayIcon}</span>
                        ) : (
                            <Bookmark size={18} style={{ color: 'white' }} />
                        )}
                    </div>

                    {/* Content area */}
                    <div className="flex-1 min-w-0">
                        {/* Top row: Title + Bookmark icon */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                {/* Title - group name only, no icon */}
                                <span
                                    className="text-base font-semibold block truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {notification.title}
                                </span>
                            </div>
                            {/* Top-right: Bookmark icon (type indicator, larger) + unread dot */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {!notification.read && !isSelectionMode && (
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    />
                                )}
                                {!isSelectionMode && (
                                    <Bookmark
                                        size={22}
                                        style={{ color: 'var(--text-secondary)' }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Body text */}
                        <p
                            className="text-sm leading-snug line-clamp-2 mt-0.5"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {notification.body}
                        </p>

                        {/* Bottom row: Time + Arrow */}
                        <div className="flex items-center justify-between mt-1.5">
                            <span
                                className="text-xs"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                {formatRelativeTime(notification.createdAt, t)}
                            </span>
                            {!isSelectionMode && (
                                <ArrowRight
                                    size={16}
                                    style={{ color: 'var(--text-tertiary)' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function NotificationsList({
    notifications,
    groups,
    onNotificationClick,
    onMarkAsRead,
    // onMarkAllAsRead - not used directly, selection mode handles bulk operations
    onDelete,
    // onDeleteAll - not used directly, selection mode handles bulk operations
    t,
    lang = 'es',
}: NotificationsListProps) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Create maps for quick group lookup
    const groupColorMap = new Map(groups.map(g => [g.id, g.color]));
    const groupIconMap = new Map(groups.map(g => [g.id, g.icon]));

    const handleEnterSelectionMode = useCallback(() => {
        setIsSelectionMode(true);
        setSelectedIds(new Set());
    }, []);

    const handleExitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    }, []);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedIds.size === notifications.length) {
            // Deselect all
            setSelectedIds(new Set());
        } else {
            // Select all
            setSelectedIds(new Set(notifications.map(n => n.id)));
        }
    }, [notifications, selectedIds.size]);

    const handleDeleteSelected = useCallback(() => {
        selectedIds.forEach(id => onDelete(id));
        handleExitSelectionMode();
    }, [selectedIds, onDelete, handleExitSelectionMode]);

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div>
            {/* Selection bar when in selection mode */}
            {isSelectionMode && (
                <NotificationSelectionBar
                    selectedCount={selectedIds.size}
                    totalCount={notifications.length}
                    onClose={handleExitSelectionMode}
                    onSelectAll={handleSelectAll}
                    onDelete={handleDeleteSelected}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Notifications list - no gaps, items have bottom borders */}
            <div>
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        groupColor={notification.groupId ? groupColorMap.get(notification.groupId) : undefined}
                        groupIcon={notification.groupId ? groupIconMap.get(notification.groupId) : undefined}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(notification.id)}
                        onNotificationClick={onNotificationClick}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                        onLongPress={handleEnterSelectionMode}
                        onToggleSelect={handleToggleSelect}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
}

export default NotificationsList;
