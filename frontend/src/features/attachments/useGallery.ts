import { useQuery } from "@tanstack/react-query";
import api from "../../lib/apiClient";
import type { GalleryFilters, GalleryResponse } from "../../types";

export function useGallery(filters: GalleryFilters = {}) {
  return useQuery<GalleryResponse, unknown>({
    queryKey: ["gallery", filters],
    retry: false,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.site) params.append("site", filters.site);
      if (filters.category) params.append("category", filters.category);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.per_page) params.append("per_page", filters.per_page.toString());

      const { data } = await api.get(`/gallery?${params.toString()}`);
      return data as GalleryResponse;
    },
  });
}
