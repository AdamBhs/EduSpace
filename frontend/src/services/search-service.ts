import { api } from "./axios";

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
) => {
  const response = await api.get(`/search/api/search/${classId}`, { params });
  return response.data.data;
};
