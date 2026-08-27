/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn, formatNaira } from './utils';

describe('cn (className utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
  });
});

describe('formatNaira', () => {
  it('formats numbers as Nigerian Naira', () => {
    const result = formatNaira(1000000);
    expect(result).toContain('₦');
    expect(result).toContain('1');
    expect(result).toContain('M');
  });

  it('handles zero', () => {
    const result = formatNaira(0);
    expect(result).toContain('₦');
  });

  it('handles large numbers', () => {
    const result = formatNaira(150000000);
    expect(result).toContain('₦');
    expect(result).toContain('150');
    expect(result).toContain('M');
  });

  it('handles small numbers', () => {
    const result = formatNaira(500000);
    expect(result).toContain('₦');
    expect(result).toContain('500');
    expect(result).toContain('K');
  });
});
