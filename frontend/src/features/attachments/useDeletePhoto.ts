import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import { useToast } from "../../components/ToastProvider";

export interface DeletePhotoInput {
  taskId: number;
  attachmentId: number;
}

async function deletePhotoApi(input: DeletePhotoInput): Promise<void> {
  await api.delete(`/tasks/${input.taskId}/attachments/${input.attachmentId}`);
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  const { push } = useToast();

  return useMutation<void, Error, DeletePhotoInput>({
    mutationKey: ["deletePhoto"],
    mutationFn: deletePhotoApi,

    onError: (err) => {
      push(err instanceof Error ? err.message : "削除に失敗しました", "error");
    },

    onSuccess: (_data, vars) => {
      push("写真を削除しました", "success");
      qc.invalidateQueries({ queryKey: ["attachments", vars.taskId] });
    },
  });
}
