// frontend/src/types/attachment.ts
export interface Attachment {
  id: number;
  task_id: number;
  task_title?: string | null;  // ギャラリーAPIで追加
  task_site?: string | null;   // ギャラリーAPIで追加
  file_type: 'photo' | 'document';
  title: string | null;
  description: string | null;
  category: string | null;
  display_order: number;
  photo_tag?: 'before' | 'during' | 'after' | 'other' | null;
  captured_at?: string | null;
  note?: string | null;
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
  photo_tag?: 'before' | 'during' | 'after' | 'other';
  captured_at?: string;
  note?: string;
}

export interface GalleryFilters {
  site?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface GalleryResponse {
  attachments: Attachment[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
  };
}
