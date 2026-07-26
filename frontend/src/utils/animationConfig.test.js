/**
 * Unit tests for animation configuration utilities.
 * Tests spring configs, motion preference detection, and stagger delays.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  prefersReducedMotion, 
  springConfigs, 
  getSpringConfig, 
  staggerDelay 
} from './animationConfig.js';

describe('animationConfig', () => {
  let originalMatchMedia;

  beforeEach(() => {
    // Store original matchMedia
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });

  describe('prefersReducedMotion', () => {
    it('should return true when prefers-reduced-motion is enabled', () => {
      window.matchMedia = (query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when prefers-reduced-motion is disabled', () => {
      window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('springConfigs', () => {
    it('should have all required spring configurations', () => {
      expect(springConfigs).toHaveProperty('gentle');
      expect(springConfigs).toHaveProperty('default');
      expect(springConfigs).toHaveProperty('snappy');
      expect(springConfigs).toHaveProperty('slow');
      expect(springConfigs).toHaveProperty('bouncy');
      expect(springConfigs).toHaveProperty('instant');
    });

    it('should have tension and friction properties for each config', () => {
      Object.keys(springConfigs).forEach(key => {
        expect(springConfigs[key]).toHaveProperty('tension');
        expect(springConfigs[key]).toHaveProperty('friction');
        expect(typeof springConfigs[key].tension).toBe('number');
        expect(typeof springConfigs[key].friction).toBe('number');
      });
    });

    it('should have correct values for default config', () => {
      expect(springConfigs.default.tension).toBe(170);
      expect(springConfigs.default.friction).toBe(26);
    });

    it('should have instant config with high tension for reduced motion', () => {
      expect(springConfigs.instant.tension).toBeGreaterThan(400);
    });
  });

  describe('getSpringConfig', () => {
    it('should return instant config when motion is reduced', () => {
      window.matchMedia = () => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      const config = getSpringConfig('default');
      expect(config).toEqual(springConfigs.instant);
    });

    it('should return requested config when motion is not reduced', () => {
      window.matchMedia = () => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      const config = getSpringConfig('gentle');
      expect(config).toEqual(springConfigs.gentle);
    });

    it('should return default config when no config name is provided', () => {
      window.matchMedia = () => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      const config = getSpringConfig();
      expect(config).toEqual(springConfigs.default);
    });

    it('should return default config when invalid config name is provided', () => {
      window.matchMedia = () => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      const config = getSpringConfig('nonexistent');
      expect(config).toEqual(springConfigs.default);
    });
  });

  describe('staggerDelay', () => {
    it('should return 0 when motion is reduced', () => {
      window.matchMedia = () => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      expect(staggerDelay(0)).toBe(0);
      expect(staggerDelay(5)).toBe(0);
      expect(staggerDelay(10, 100)).toBe(0);
    });

    it('should calculate delay based on index when motion is not reduced', () => {
      window.matchMedia = () => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      expect(staggerDelay(0)).toBe(0);
      expect(staggerDelay(1)).toBe(50);
      expect(staggerDelay(2)).toBe(100);
      expect(staggerDelay(5)).toBe(250);
    });

    it('should use custom base delay when provided', () => {
      window.matchMedia = () => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      expect(staggerDelay(0, 100)).toBe(0);
      expect(staggerDelay(1, 100)).toBe(100);
      expect(staggerDelay(2, 100)).toBe(200);
      expect(staggerDelay(3, 80)).toBe(240);
    });

    it('should use default base delay of 50ms', () => {
      window.matchMedia = () => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      });

      expect(staggerDelay(3)).toBe(150); // 3 * 50
    });
  });
});
