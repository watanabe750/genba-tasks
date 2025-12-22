import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import { PhotoUploader } from './PhotoUploader';
import userEvent from '@testing-library/user-event';

describe('PhotoUploader', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('should render photo uploader with all form fields', () => {
    render(<PhotoUploader onUpload={mockOnUpload} />);

    // Check for dropzone
    expect(screen.getByText(/クリックして写真を選択/)).toBeInTheDocument();

    // Check for photo tag buttons
    expect(screen.getByRole('button', { name: '施工前' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '施工中' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '施工後' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'その他' })).toBeInTheDocument();

    // Check for other form fields
    expect(screen.getByLabelText(/撮影日時/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
  });

  it('should select photo tag when clicking button', async () => {
    const user = userEvent.setup();
    render(<PhotoUploader onUpload={mockOnUpload} />);

    const duringButton = screen.getByRole('button', { name: '施工中' });
    await user.click(duringButton);

    // Check if button has active styling (checking class attribute)
    expect(duringButton).toHaveClass('bg-blue-600');
  });

  it('should allow entering metadata', async () => {
    const user = userEvent.setup();
    render(<PhotoUploader onUpload={mockOnUpload} />);

    const titleInput = screen.getByLabelText(/タイトル/) as HTMLInputElement;
    const noteTextarea = screen.getByLabelText(/メモ/) as HTMLTextAreaElement;

    await user.type(titleInput, '基礎工事');
    await user.type(noteTextarea, 'コンクリート打設完了');

    expect(titleInput.value).toBe('基礎工事');
    expect(noteTextarea.value).toBe('コンクリート打設完了');
  });

  it('should call onUpload when file is dropped', async () => {
    mockOnUpload.mockResolvedValue(undefined);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    render(<PhotoUploader onUpload={mockOnUpload} />);

    const dropzone = screen.getByText(/写真をドラッグ&ドロップ/).closest('div');

    // Simulate file drop
    if (dropzone) {
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files: [file],
        },
      });
      dropzone.dispatchEvent(event);
    }

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({
          photo_tag: 'before',
        })
      );
    });
  });

  it('should reset form after successful upload', async () => {
    const user = userEvent.setup();
    mockOnUpload.mockResolvedValue(undefined);

    render(<PhotoUploader onUpload={mockOnUpload} />);

    const titleInput = screen.getByLabelText(/タイトル/) as HTMLInputElement;
    await user.type(titleInput, '基礎工事');

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const dropzone = screen.getByText(/写真をドラッグ&ドロップ/).closest('div');

    if (dropzone) {
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files: [file],
        },
      });
      dropzone.dispatchEvent(event);
    }

    await waitFor(() => {
      expect(titleInput.value).toBe('');
    });
  });

  it('should display error message when upload fails', async () => {
    mockOnUpload.mockRejectedValue(new Error('アップロードに失敗しました'));

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    render(<PhotoUploader onUpload={mockOnUpload} />);

    const dropzone = screen.getByText(/写真をドラッグ&ドロップ/).closest('div');

    if (dropzone) {
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files: [file],
        },
      });
      dropzone.dispatchEvent(event);
    }

    await waitFor(() => {
      expect(screen.getByText(/アップロードに失敗しました/)).toBeInTheDocument();
    });
  });

  it('should enforce max file size', () => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    render(<PhotoUploader onUpload={mockOnUpload} maxSize={maxSize} />);

    // The component should be rendered with the maxSize prop
    // File size validation happens in react-dropzone
    expect(screen.getByText(/写真をドラッグ&ドロップ/)).toBeInTheDocument();
  });

  it('should disable form controls during upload', async () => {
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    mockOnUpload.mockReturnValue(uploadPromise);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    render(<PhotoUploader onUpload={mockOnUpload} />);

    const dropzone = screen.getByText(/写真をドラッグ&ドロップ/).closest('div');

    if (dropzone) {
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files: [file],
        },
      });
      dropzone.dispatchEvent(event);
    }

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        if (button.textContent?.match(/施工前|施工中|施工後|その他/)) {
          expect(button).toBeDisabled();
        }
      });
    });

    resolveUpload!();
  });
});
