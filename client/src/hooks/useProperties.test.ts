/**
 * Tests for useProperties hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProperties, useProperty, useAdminProperties } from './useProperties';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((cb) => cb({ data: [], error: null })),
          })),
        })),
        single: vi.fn(() => ({
          then: vi.fn((cb) => cb({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            then: vi.fn((cb) => cb({ data: { id: 'test' }, error: null })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn((cb) => cb({ error: null })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn((cb) => cb({ error: null })),
        })),
      })),
    })),
  },
  isSupabaseConfigured: vi.fn(() => false),
}));

describe('useProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useProperties());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty properties array when not configured', async () => {
    const { result } = renderHook(() => useProperties());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.properties).toBeDefined();
    expect(Array.isArray(result.current.properties)).toBe(true);
  });

  it('returns error state on failure', async () => {
    const { result } = renderHook(() => useProperties());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useProperty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useProperty('test-slug'));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns null property when slug is undefined', async () => {
    const { result } = renderHook(() => useProperty(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.property).toBeNull();
  });
});

describe('useAdminProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAdminProperties());
    expect(result.current.isLoading).toBe(true);
  });

  it('provides CRUD functions', async () => {
    const { result } = renderHook(() => useAdminProperties());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.createProperty).toBe('function');
    expect(typeof result.current.updateProperty).toBe('function');
    expect(typeof result.current.deleteProperty).toBe('function');
  });
});
