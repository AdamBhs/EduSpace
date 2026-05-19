import axios from "axios";

const CLASS_SERVICE_URL = process.env.CLASS_SERVICE_URL || "http://localhost:3003";

export async function fetchMemberIds(classId: string): Promise<{
  adminIds: string[];
  memberIds: string[];
  allIds: string[];
}> {
  try {
    const res = await axios.get(`${CLASS_SERVICE_URL}/api/classroom/internal/${classId}/member-ids`);
    return res.data.data;
  } catch {
    console.error(`[classService] Failed to fetch member IDs for ${classId}`);
    return { adminIds: [], memberIds: [], allIds: [] };
  }
}
