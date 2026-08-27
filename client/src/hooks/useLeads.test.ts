/**
 * Tests for useLeads hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminLeads, useDashboardStats, submitLead } from './useLeads';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn((cb) => cb({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        then: vi.fn((cb) => cb({ error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          then: vi.fn((cb) => cb({ error: null })),
        })),
      })),
    })),
  },
  isSupabaseConfigured: vi.fn(() => false),
}));

describe('useAdminLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAdminLeads());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty leads array when not configured', async () => {
    const { result } = renderHook(() => useAdminLeads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.leads).toBeDefined();
    expect(Array.isArray(result.current.leads)).toBe(true);
  });

  it('provides status update function', async () => {
    const { result } = renderHook(() => useAdminLeads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.updateLeadStatus).toBe('function');
  });
});

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns stats object after loading', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(typeof result.current.stats.totalProperties).toBe('number');
    expect(typeof result.current.stats.newLeads).toBe('number');
  });
});

describe('submitLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('creates a lead and returns success', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '08012345678',
      interestType: 'Property Enquiry' as const,
      message: 'Test message',
      source: 'website' as const,
      page: '/properties/test',
    };

    const result = await submitLead(payload);

    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('generates unique lead IDs', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '08012345678',
      interestType: 'Property Enquiry' as const,
      message: 'Test message',
      source: 'website' as const,
      page: '/properties/test',
    };

    const result1 = await submitLead(payload);
    const result2 = await submitLead(payload);

    expect(result1.leadId).not.toBe(result2.leadId);
  });
});
