import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { Attachment } from "../../types";

export function useAttachments(taskId?: number | null) {
  return useQuery<Attachment[], unknown>({
    queryKey: ["attachments", taskId],
    enabled: !!taskId,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}/attachments`);
      return data as Attachment[];
    },
  });
}
