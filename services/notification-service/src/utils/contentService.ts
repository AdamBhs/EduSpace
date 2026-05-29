import axios from "axios";

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || "http://localhost:3004";

export interface UpcomingAssignment {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
}

export async function fetchUpcomingDue(): Promise<UpcomingAssignment[]> {
  try {
    const response = await axios.get(`${CONTENT_SERVICE_URL}/api/posts/internal/upcoming-due`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error("[contentService] Failed to fetch upcoming due:", error instanceof Error ? error.message : error);
    return [];
  }
}
