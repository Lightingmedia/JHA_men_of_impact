import { renderHook, act } from '@testing-library/react';
import { useAuthProvider } from './useAuth';
import { supabase } from '../lib/supabase';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn(),
  },
}));

const mockMembers = [
  { id: 1, full_name: 'John Doe', phone: '(123) 456-7890' },
  { id: 2, full_name: 'Jane Smith', phone: '987-654-3210' },
];

describe('useAuth', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should not authenticate with a partial phone number', async () => {
    (supabase.order as vi.Mock).mockResolvedValueOnce({ data: mockMembers, error: null });

    const { result } = renderHook(() => useAuthProvider());

    await act(async () => {
      const loginResult = await result.current.signInWithPhone('123');
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toContain('Phone number not found');
    });

    expect(result.current.user).toBeNull();
  });

  it('should authenticate with a full, matching phone number', async () => {
    (supabase.order as vi.Mock).mockResolvedValueOnce({ data: mockMembers, error: null });

    const { result } = renderHook(() => useAuthProvider());

    await act(async () => {
      const loginResult = await result.current.signInWithPhone('(123) 456-7890');
      expect(loginResult.success).toBe(true);
      expect(loginResult.error).toBeUndefined();
    });

    expect(result.current.user).toEqual(mockMembers[0]);
  });
});