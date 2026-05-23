import { api } from "./axios";
import type { SearchHit } from "@/shared/types";

export const searchPosts = async (
  classId: string,
  params: {
    q: string;
    type?: string;
    studyMaterialType?: string;
    chapterId?: string;
    dateFrom?: string;
    dateTo?: string;
    from?: number;
    size?: number;
  },
): Promise<{ total: number; hits: SearchHit[] }> => {
  const response = await api.get(`/search/api/search/${classId}`, { params });
  return response.data.data;
};

export const searchAllClassrooms = async (
  classIds: string[],
  query: string,
): Promise<SearchHit[]> => {
  const results = await Promise.allSettled(
    classIds.map((classId) =>
      searchPosts(classId, { q: query, size: 5 }),
    ),
  );

  const hits: SearchHit[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      hits.push(...result.value.hits);
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, 10);
};
