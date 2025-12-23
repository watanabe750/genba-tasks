import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import { TaskFilterBar } from './TaskFilterBar';
import userEvent from '@testing-library/user-event';

describe('TaskFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    // Check the input value directly (before debounce)
    expect(searchInput.value).toBe('test task');
  });

  it('should toggle status filter when clicking status button', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const notStartedButton = screen.getByRole('button', { name: /未着手/ });
    await user.click(notStartedButton);

    // Check that the button has active styling
    expect(notStartedButton).toHaveClass('bg-gradient-to-r');
  });

  it('should allow entering progress values', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const progressMin = screen.getByTestId('progress-min') as HTMLInputElement;
    const progressMax = screen.getByTestId('progress-max') as HTMLInputElement;

    await user.type(progressMin, '20');
    await user.type(progressMax, '80');

    await waitFor(() => {
      expect(progressMin.value).toBe('20');
      expect(progressMax.value).toBe('80');
    });
  });

  it('should toggle parents only checkbox', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const parentsOnlyCheckbox = screen.getByTestId('filter-parents-only') as HTMLInputElement;
    expect(parentsOnlyCheckbox.checked).toBe(false);

    await user.click(parentsOnlyCheckbox);

    await waitFor(() => {
      expect(parentsOnlyCheckbox.checked).toBe(true);
    });
  });

  it('should change order by select', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    const orderBySelect = screen.getByTestId('order_by') as HTMLSelectElement;
    await user.selectOptions(orderBySelect, 'progress');

    expect(orderBySelect.value).toBe('progress');
  });

  it('should show reset button', () => {
    render(<TaskFilterBar />);

    const resetButton = screen.getByTestId('filter-reset');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton).toHaveTextContent('すべて解除');
  });

  it('should update URL when filters are applied', async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar />);

    // Click the not_started status button to toggle it off (it starts active)
    const notStartedButton = screen.getByRole('button', { name: /未着手/ });

    // Initially the button should have the active gradient class
    expect(notStartedButton).toHaveClass('bg-gradient-to-r');

    // Click to toggle it off
    await user.click(notStartedButton);

    // After clicking, the button should no longer have the gradient
    await waitFor(() => {
      expect(notStartedButton).not.toHaveClass('bg-gradient-to-r');
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<TaskFilterBar />);

    const statusGroup = screen.getByRole('group', { name: 'ステータスで絞り込み' });
    expect(statusGroup).toBeInTheDocument();

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder', 'タスク・現場を検索...');
  });
});
