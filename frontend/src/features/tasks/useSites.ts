import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";

export function useSites(enabled = true) {
  return useQuery<string[], Error>({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await api.get<string[]>("/tasks/sites");
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}