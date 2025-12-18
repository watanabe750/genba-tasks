import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Attachment } from "../../types";
import { useToast } from "../../components/ToastProvider";

export interface UploadPhotoInput {
  taskId: number;
  file: File;
  title?: string;
  description?: string;
  category?: string;
  photo_tag?: 'before' | 'during' | 'after' | 'other';
  note?: string;
  captured_at?: string;
}

async function uploadPhotoApi(input: UploadPhotoInput): Promise<Attachment> {
  const formData = new FormData();
  formData.append("attachment[file]", input.file);
  formData.append("attachment[file_type]", "photo");

  if (input.title) {
    formData.append("attachment[title]", input.title);
  }
  if (input.description) {
    formData.append("attachment[description]", input.description);
  }
  if (input.category) {
    formData.append("attachment[category]", input.category);
  }
  if (input.photo_tag) {
    formData.append("attachment[photo_tag]", input.photo_tag);
  }
  if (input.note) {
    formData.append("attachment[note]", input.note);
  }
  if (input.captured_at) {
    formData.append("attachment[captured_at]", input.captured_at);
  }

  const { data } = await api.post<Attachment>(
    `/tasks/${input.taskId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  const { push } = useToast();

  return useMutation<Attachment, Error, UploadPhotoInput>({
    mutationKey: ["uploadPhoto"],
    mutationFn: uploadPhotoApi,

    onError: (err) => {
      push(err instanceof Error ? err.message : "アップロードに失敗しました", "error");
    },

    onSuccess: (_data, vars) => {
      push("写真をアップロードしました", "success");
      qc.invalidateQueries({ queryKey: ["attachments", vars.taskId] });
    },
  });
}
