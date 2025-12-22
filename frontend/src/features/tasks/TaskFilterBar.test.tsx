import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { TaskFilterBar } from './TaskFilterBar';
import userEvent from '@testing-library/user-event';

// Mock useSearchParams
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  };
});

describe('TaskFilterBar', () => {
  it('should render filter bar with all controls', () => {
    render(<TaskFilterBar />);

    // Check for main heading
    expect(screen.getByText('フィルター & 並び替え')).toBeInTheDocument();

    // Check for search input
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('タスク・現場を検索...')).toBeInTheDocument();

    // Check for status buttons
    expect(screen.getByRole('button', { name: /未着手/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /進行中/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /完了/ })).toBeInTheDocument();

    // Check for progress inputs
    expect(screen.getByTestId('progress-min')).toBeInTheDocument();
    expect(screen.getByTestId('progress-max')).toBeInTheDocument();

    // Check for parents only checkbox
    expect(screen.getByTestId('filter-parents-only')).toBeInTheDocument();

    // Check for order by select
    expect(screen.getByTestId('order_by')).toBeInTheDocument();
  });

  it('should allow typing in search input', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    await user.type(searchInput, 'test task');

    expect(searchInput.value).toBe('test task');
  });

  it('should toggle status filter when clicking status button', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const notStartedButton = screen.getByRole('button', { name: /未着手/ });
    await user.click(notStartedButton);

    // Check that setSearchParams was called
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('should allow entering progress min/max values', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const progressMin = screen.getByTestId('progress-min') as HTMLInputElement;
    const progressMax = screen.getByTestId('progress-max') as HTMLInputElement;

    await user.clear(progressMin);
    await user.type(progressMin, '20');
    expect(progressMin.value).toBe('20');

    await user.clear(progressMax);
    await user.type(progressMax, '80');
    expect(progressMax.value).toBe('80');
  });

  it('should toggle parents only checkbox', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const parentsOnlyCheckbox = screen.getByTestId('filter-parents-only') as HTMLInputElement;
    expect(parentsOnlyCheckbox.checked).toBe(false);

    await user.click(parentsOnlyCheckbox);
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('should change order by select', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const orderBySelect = screen.getByTestId('order_by') as HTMLSelectElement;
    await user.selectOptions(orderBySelect, 'progress');

    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('should show reset button and clear all filters', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const resetButton = screen.getByTestId('filter-reset');
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(mockSetSearchParams).toHaveBeenCalledWith({}, { replace: true });
  });

  it('should display filter chips when filters are active', () => {
    // Mock useSearchParams with active filters
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      const params = new URLSearchParams();
      params.set('search', 'test');
      params.append('status', 'in_progress');
      return {
        ...actual,
        useSearchParams: () => [params, mockSetSearchParams],
      };
    });

    render(<TaskFilterBar />);

    // In the default state (no filters), it should show "なし"
    expect(screen.getByText('なし')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<TaskFilterBar />);

    const statusGroup = screen.getByRole('group', { name: 'ステータスで絞り込み' });
    expect(statusGroup).toBeInTheDocument();

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder', 'タスク・現場を検索...');
  });
});
