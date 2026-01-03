/**
 * Tests for Animation Constants
 *
 * Story 14.1: Animation Framework
 * Epic 14: Core Implementation
 *
 * Validates animation token values match motion-design-system.md specification.
 */

import { describe, it, expect } from 'vitest';
import {
  ANIMATION,
  DURATION,
  EASING,
  STAGGER,
  BREATHING,
  CELEBRATION,
} from '../../../../src/components/animation/constants';

describe('Animation Constants', () => {
  describe('DURATION', () => {
    it('should define INSTANT as 0ms', () => {
      expect(DURATION.INSTANT).toBe(0);
    });

    it('should define FAST as 100ms per motion-design-system.md', () => {
      expect(DURATION.FAST).toBe(100);
    });

    it('should define NORMAL as 200ms', () => {
      expect(DURATION.NORMAL).toBe(200);
    });

    it('should define SLOW as 300ms', () => {
      expect(DURATION.SLOW).toBe(300);
    });

    it('should define SLOWER as 400ms', () => {
      expect(DURATION.SLOWER).toBe(400);
    });

    it('should define BREATHING as 3000ms per motion-design-system.md', () => {
      expect(DURATION.BREATHING).toBe(3000);
    });

    it('should define CELEBRATION as 500ms', () => {
      expect(DURATION.CELEBRATION).toBe(500);
    });
  });

  describe('EASING', () => {
    it('should define DEFAULT easing', () => {
      expect(EASING.DEFAULT).toBe('ease');
    });

    it('should define OUT easing (ease-out curve)', () => {
      expect(EASING.OUT).toBe('cubic-bezier(0, 0, 0.2, 1)');
    });

    it('should define IN_OUT easing (smooth, organic)', () => {
      expect(EASING.IN_OUT).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('should define IN easing (accelerating away)', () => {
      expect(EASING.IN).toBe('cubic-bezier(0.4, 0, 1, 1)');
    });

    it('should define SPRING easing (playful overshoot)', () => {
      expect(EASING.SPRING).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
    });

    it('should define LINEAR easing', () => {
      expect(EASING.LINEAR).toBe('linear');
    });
  });

  describe('STAGGER', () => {
    it('should define DEFAULT stagger as 100ms (matches Epic 11.3)', () => {
      expect(STAGGER.DEFAULT).toBe(100);
    });

    it('should define FAST stagger as 50ms', () => {
      expect(STAGGER.FAST).toBe(50);
    });

    it('should define INITIAL_DELAY as 300ms (matches Epic 11.3)', () => {
      expect(STAGGER.INITIAL_DELAY).toBe(300);
    });

    it('should define MAX_DURATION as 2500ms (matches Epic 11.3)', () => {
      expect(STAGGER.MAX_DURATION).toBe(2500);
    });
  });

  describe('BREATHING', () => {
    it('should define CYCLE_DURATION as 3000ms per motion-design-system.md', () => {
      expect(BREATHING.CYCLE_DURATION).toBe(3000);
    });

    it('should define SCALE_MIN as 1 (no change)', () => {
      expect(BREATHING.SCALE_MIN).toBe(1);
    });

    it('should define SCALE_MAX as 1.02 (2% growth)', () => {
      expect(BREATHING.SCALE_MAX).toBe(1.02);
    });

    it('should define OPACITY_MIN as 0.9', () => {
      expect(BREATHING.OPACITY_MIN).toBe(0.9);
    });

    it('should define OPACITY_MAX as 1.0', () => {
      expect(BREATHING.OPACITY_MAX).toBe(1.0);
    });
  });

  describe('CELEBRATION', () => {
    it('should define SPRING_TENSION', () => {
      expect(CELEBRATION.SPRING_TENSION).toBe(180);
    });

    it('should define SPRING_FRICTION', () => {
      expect(CELEBRATION.SPRING_FRICTION).toBe(12);
    });

    it('should define HAPTIC_SMALL pattern', () => {
      expect(CELEBRATION.HAPTIC_SMALL).toEqual([50]);
    });

    it('should define HAPTIC_BIG pattern', () => {
      expect(CELEBRATION.HAPTIC_BIG).toEqual([100, 50, 100]);
    });
  });

  describe('ANIMATION (combined)', () => {
    it('should contain all sub-objects', () => {
      expect(ANIMATION.DURATION).toBe(DURATION);
      expect(ANIMATION.EASING).toBe(EASING);
      expect(ANIMATION.STAGGER).toBe(STAGGER);
      expect(ANIMATION.BREATHING).toBe(BREATHING);
      expect(ANIMATION.CELEBRATION).toBe(CELEBRATION);
    });
  });
});
