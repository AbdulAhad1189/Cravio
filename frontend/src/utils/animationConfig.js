/**
 * Animation configuration utilities for React Spring animations.
 * Provides spring presets and motion preference detection.
 * 
 * Validates Requirements 12.1, 12.2, 12.3:
 * - Detects user's prefers-reduced-motion setting
 * - Reduces animation duration when motion is reduced
 * - Maintains essential animations for state feedback
 */

/**
 * Detect if user has prefers-reduced-motion enabled.
 * Returns true if user prefers reduced motion, false otherwise.
 * 
 * @returns {boolean} Whether user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Spring configuration presets for different animation types.
 * Based on React Spring's spring physics (tension and friction).
 * 
 * Tension: Higher values create faster, snappier animations
 * Friction: Higher values create more damping, slower settling
 */
export const springConfigs = {
  // Gentle, smooth animations for page transitions
  gentle: {
    tension: 120,
    friction: 14,
  },
  
  // Default spring for most UI elements
  default: {
    tension: 170,
    friction: 26,
  },
  
  // Snappy animations for interactive feedback
  snappy: {
    tension: 300,
    friction: 30,
  },
  
  // Slow animations for emphasis
  slow: {
    tension: 80,
    friction: 20,
  },
  
  // Bouncy animations for playful interactions
  bouncy: {
    tension: 180,
    friction: 12,
  },
  
  // Instant transition for reduced motion preference
  instant: {
    tension: 500,
    friction: 50,
  },
};

/**
 * Get spring configuration based on motion preferences.
 * Returns instant config if user prefers reduced motion,
 * otherwise returns the requested config.
 * 
 * @param {string} configName - Name of the spring config to use (default: 'default')
 * @returns {Object} Spring configuration object with tension and friction
 */
export const getSpringConfig = (configName = 'default') => {
  if (prefersReducedMotion()) {
    return springConfigs.instant;
  }
  return springConfigs[configName] || springConfigs.default;
};

/**
 * Calculate animation delay for staggered animations.
 * Returns 0 if user prefers reduced motion, otherwise returns
 * the calculated delay based on index and base delay.
 * 
 * @param {number} index - Index of the item in the list (0-based)
 * @param {number} baseDelay - Base delay in milliseconds between items (default: 50)
 * @returns {number} Delay in milliseconds
 */
export const staggerDelay = (index, baseDelay = 50) => {
  return prefersReducedMotion() ? 0 : index * baseDelay;
};
