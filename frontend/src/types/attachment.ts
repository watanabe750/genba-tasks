// frontend/src/types/attachment.ts
export interface Attachment {
  id: number;
  task_id: number;
  file_type: 'photo' | 'document';
  title: string | null;
  description: string | null;
  category: string | null;
  display_order: number;
  url: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  size: number | null;
  filename: string | null;
  created_at: string;
}

export interface CreateAttachmentPayload {
  file: File;
  file_type: 'photo' | 'document';
  title?: string;
  description?: string;
  category?: string;
  display_order?: number;
}
