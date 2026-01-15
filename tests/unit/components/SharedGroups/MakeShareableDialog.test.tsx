/**
 * MakeShareableDialog Component Tests
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the two-stage dialog for making custom groups shareable.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MakeShareableDialog } from '../../../../src/components/SharedGroups/MakeShareableDialog';
import type { TransactionGroup } from '../../../../src/types/transactionGroup';
import type { SharedGroup } from '../../../../src/types/sharedGroup';

// Mock react-dom createPortal to render inline for testing
vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
        ...actual,
        createPortal: (children: React.ReactNode) => children,
    };
});

describe('MakeShareableDialog', () => {
    const mockGroup: TransactionGroup = {
        id: 'group-123',
        name: '🏠 Gastos del Hogar',
        color: '#10b981',
        transactionCount: 5,
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
    };

    const mockSharedGroup: SharedGroup = {
        id: 'shared-123',
        ownerId: 'user-1',
        appId: 'boletapp',
        name: '🏠 Gastos del Hogar',
        color: '#10b981',
        icon: '🏠',
        shareCode: 'Ab3dEf7hIj9kLm0p',
        shareCodeExpiresAt: { toDate: () => new Date('2026-01-22') } as any,
        members: ['user-1'],
        memberUpdates: {},
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
    };

    const defaultProps = {
        isOpen: true,
        group: mockGroup,
        onClose: vi.fn(),
        onMakeShareable: vi.fn().mockResolvedValue(mockSharedGroup),
        t: (key: string) => key,
        lang: 'es' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset body overflow
        document.body.style.overflow = '';
    });

    afterEach(() => {
        document.body.style.overflow = '';
    });

    describe('rendering', () => {
        it('should render dialog when isOpen is true', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            render(<MakeShareableDialog {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should not render when group is null', () => {
            render(<MakeShareableDialog {...defaultProps} group={null} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should show group name in dialog', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByText('Gastos del Hogar')).toBeInTheDocument();
        });

        it('should show confirmation stage title in Spanish', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByText('Compartir Grupo')).toBeInTheDocument();
        });

        it('should show confirmation stage title in English', () => {
            render(<MakeShareableDialog {...defaultProps} lang="en" />);

            expect(screen.getByText('Share Group')).toBeInTheDocument();
        });
    });

    describe('confirmation stage', () => {
        it('should show explanation of what sharing means', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByText('Al compartir este grupo:')).toBeInTheDocument();
            expect(screen.getByText(/Otras personas podrán ver tus transacciones/)).toBeInTheDocument();
        });

        it('should show privacy warning', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByText(/Solo comparte con personas de confianza/)).toBeInTheDocument();
        });

        it('should show cancel and confirm buttons', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByTestId('make-shareable-cancel')).toBeInTheDocument();
            expect(screen.getByTestId('make-shareable-confirm')).toBeInTheDocument();
        });
    });

    describe('close behavior', () => {
        it('should call onClose when cancel button clicked', async () => {
            const onClose = vi.fn();
            render(<MakeShareableDialog {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByTestId('make-shareable-cancel'));

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when close button clicked', async () => {
            const onClose = vi.fn();
            render(<MakeShareableDialog {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByTestId('make-shareable-close'));

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when backdrop clicked', async () => {
            const onClose = vi.fn();
            render(<MakeShareableDialog {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByTestId('make-shareable-dialog-overlay'));

            expect(onClose).toHaveBeenCalled();
        });

        it('should call onClose when Escape key pressed', async () => {
            const onClose = vi.fn();
            render(<MakeShareableDialog {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onClose).toHaveBeenCalled();
        });

        it('should prevent body scroll when open', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should restore body scroll when closed', () => {
            const { rerender } = render(<MakeShareableDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');

            rerender(<MakeShareableDialog {...defaultProps} isOpen={false} />);

            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('make shareable flow', () => {
        it('should call onMakeShareable when confirm button clicked', async () => {
            const onMakeShareable = vi.fn().mockResolvedValue(mockSharedGroup);
            render(<MakeShareableDialog {...defaultProps} onMakeShareable={onMakeShareable} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(onMakeShareable).toHaveBeenCalledWith(mockGroup);
            });
        });

        it('should show loading state while creating', async () => {
            let resolveCreate: (value: SharedGroup) => void;
            const onMakeShareable = vi.fn().mockImplementation(
                () => new Promise<SharedGroup>((resolve) => { resolveCreate = resolve; })
            );

            render(<MakeShareableDialog {...defaultProps} onMakeShareable={onMakeShareable} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByText('Creando...')).toBeInTheDocument();
            });

            resolveCreate!(mockSharedGroup);
        });

        it('should transition to share stage after successful creation', async () => {
            render(<MakeShareableDialog {...defaultProps} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByText('Grupo Compartido!')).toBeInTheDocument();
            });
        });

        it('should show share code after successful creation', async () => {
            render(<MakeShareableDialog {...defaultProps} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByTestId('share-code')).toHaveTextContent('Ab3dEf7hIj9kLm0p');
            });
        });

        it('should show done button in share stage', async () => {
            render(<MakeShareableDialog {...defaultProps} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByTestId('make-shareable-done')).toBeInTheDocument();
            });
        });

        it('should close dialog when done button clicked', async () => {
            const onClose = vi.fn();
            render(<MakeShareableDialog {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByTestId('make-shareable-done')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTestId('make-shareable-done'));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should show error message when creation fails', async () => {
            const onMakeShareable = vi.fn().mockRejectedValue(new Error('Network error'));
            render(<MakeShareableDialog {...defaultProps} onMakeShareable={onMakeShareable} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByText('Error al crear el grupo compartido')).toBeInTheDocument();
            });
        });

        it('should show English error message', async () => {
            const onMakeShareable = vi.fn().mockRejectedValue(new Error('Network error'));
            render(<MakeShareableDialog {...defaultProps} onMakeShareable={onMakeShareable} lang="en" />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByText('Failed to create shared group')).toBeInTheDocument();
            });
        });

        it('should stay on confirmation stage after error', async () => {
            const onMakeShareable = vi.fn().mockRejectedValue(new Error('Network error'));
            render(<MakeShareableDialog {...defaultProps} onMakeShareable={onMakeShareable} />);

            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByText('Error al crear el grupo compartido')).toBeInTheDocument();
            });

            // Should still show confirm button (not done button)
            expect(screen.getByTestId('make-shareable-confirm')).toBeInTheDocument();
        });
    });

    describe('state reset', () => {
        it('should reset to confirmation stage when reopened', async () => {
            const { rerender } = render(<MakeShareableDialog {...defaultProps} />);

            // Go to share stage
            fireEvent.click(screen.getByTestId('make-shareable-confirm'));

            await waitFor(() => {
                expect(screen.getByText('Grupo Compartido!')).toBeInTheDocument();
            });

            // Close and reopen
            rerender(<MakeShareableDialog {...defaultProps} isOpen={false} />);
            rerender(<MakeShareableDialog {...defaultProps} isOpen={true} />);

            // Should be back to confirmation stage
            expect(screen.getByText('Compartir Grupo')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have aria-modal attribute', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });

        it('should have aria-labelledby pointing to title', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'make-shareable-title');
        });

        it('should have close button with aria-label', () => {
            render(<MakeShareableDialog {...defaultProps} />);

            const closeButton = screen.getByTestId('make-shareable-close');
            expect(closeButton).toHaveAttribute('aria-label');
        });
    });
});
