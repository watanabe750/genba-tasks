import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import { PhotoUploader } from './PhotoUploader';
import userEvent from '@testing-library/user-event';

describe('PhotoUploader', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
    mockOnUpload.mockResolvedValue(undefined);
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

  it('should accept file input', async () => {
    const user = userEvent.setup();
    render(<PhotoUploader onUpload={mockOnUpload} />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    // react-dropzone hides the input element, so we need to find it differently
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    }
  });

  it('should display uploading state', async () => {
    const user = userEvent.setup();

    // Mock a slow upload
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    mockOnUpload.mockReturnValue(uploadPromise);

    render(<PhotoUploader onUpload={mockOnUpload} />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await user.upload(input, file);

      // Check that buttons are disabled during upload
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const photoTagButtons = buttons.filter((button) =>
          button.textContent?.match(/施工前|施工中|施工後|その他/)
        );
        photoTagButtons.forEach((button) => {
          expect(button).toBeDisabled();
        });
      });

      // Resolve the upload
      resolveUpload!();
    }
  });

  it('should reset form after successful upload', async () => {
    const user = userEvent.setup();
    render(<PhotoUploader onUpload={mockOnUpload} />);

    const titleInput = screen.getByLabelText(/タイトル/) as HTMLInputElement;
    await user.type(titleInput, '基礎工事');

    expect(titleInput.value).toBe('基礎工事');

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await user.upload(input, file);

      await waitFor(() => {
        expect(titleInput.value).toBe('');
      });
    }
  });

  it('should display error message when upload fails', async () => {
    const user = userEvent.setup();
    mockOnUpload.mockRejectedValue(new Error('アップロードに失敗しました'));

    render(<PhotoUploader onUpload={mockOnUpload} />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/アップロードに失敗しました/)).toBeInTheDocument();
      });
    }
  });

  it('should display file size limit', () => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    render(<PhotoUploader onUpload={mockOnUpload} maxSize={maxSize} />);

    expect(screen.getByText(/最大.*10.*MB/)).toBeInTheDocument();
  });
});
