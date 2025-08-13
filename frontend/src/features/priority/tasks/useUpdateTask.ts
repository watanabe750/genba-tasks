import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/apiClient";
import type { Task } from "../../../types/task";

type UpdateInput = { id: number; data: Partial<Pick<Task, "status" | "progress">> };

export function useUpdateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: UpdateInput) =>
            api.patch(`/api/tasks/${id}`, { task: data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["priorityTasks"] });
            qc.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}