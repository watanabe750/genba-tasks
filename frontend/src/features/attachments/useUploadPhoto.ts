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
