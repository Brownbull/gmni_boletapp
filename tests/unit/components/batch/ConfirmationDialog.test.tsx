/**
 * Backward-compatibility test — verifies re-export from batch/ works.
 * Full test suite moved to tests/unit/components/shared/ConfirmationDialog.test.tsx
 * Story 15-3a
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmationDialog } from '../../../../src/components/batch/ConfirmationDialog';

describe('ConfirmationDialog (batch re-export)', () => {
  it('should render via the batch re-export path', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test"
        message="Test message"
        theme="light"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
