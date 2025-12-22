import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateTask } from './useUpdateTask';
import api from '../../lib/apiClient';
import type { Task } from '../../types';
import { ReactNode } from 'react';

// Mock dependencies
vi.mock('../../lib/apiClient');
vi.mock('../../components/ToastProvider', () => ({
  useToast: () => ({
    push: vi.fn(),
  }),
}));

describe('useUpdateTask', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should normalize and send update data with trimmed title', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Updated Task',
      status: 'in_progress',
      progress: 50,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { title: '  Updated Task  ', progress: 50 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify that api.patch was called with trimmed title
    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          title: 'Updated Task', // trimmed
          progress: 50,
        }),
      })
    );
  });

  it('should clamp progress value to maximum 100', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      status: 'completed',
      progress: 100,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { progress: 150 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          progress: 100, // clamped to 100
          status: 'completed', // auto-set when progress is 100
        }),
      })
    );
  });

  it('should clamp progress value to minimum 0', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      status: 'not_started',
      progress: 0,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { progress: -10 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          progress: 0, // clamped to 0
        }),
      })
    );
  });

  it('should set status to completed when progress is 100', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      status: 'completed',
      progress: 100,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { progress: 100 },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          progress: 100,
          status: 'completed',
        }),
      })
    );
  });

  it('should set progress to 100 when status is completed', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      status: 'completed',
      progress: 100,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { status: 'completed' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          status: 'completed',
          progress: 100, // auto-set to 100
        }),
      })
    );
  });

  it('should set progress to 0 when status is not_started', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      status: 'not_started',
      progress: 0,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { status: 'not_started' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          status: 'not_started',
          progress: 0, // auto-set to 0
        }),
      })
    );
  });

  it('should handle null deadline and site', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      status: 'in_progress',
      progress: 50,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { deadline: null, site: null },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/1',
      expect.objectContaining({
        task: expect.objectContaining({
          deadline: null,
          site: null,
        }),
      })
    );
  });

  it('should handle API error', async () => {
    vi.mocked(api.patch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { title: 'Updated Task' },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Network error');
  });

  it('should invalidate queries on success', async () => {
    const mockTask: Task = {
      id: 1,
      title: 'Updated Task',
      status: 'in_progress',
      progress: 50,
      deadline: null,
      site: null,
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
    };

    vi.mocked(api.patch).mockResolvedValue({ data: mockTask });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    result.current.mutate({
      id: 1,
      data: { title: 'Updated Task' },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
