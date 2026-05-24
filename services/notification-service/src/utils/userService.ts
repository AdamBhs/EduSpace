import axios from "axios";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3002";

export async function fetchUserEmails(
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  try {
    const response = await axios.post(`${USER_SERVICE_URL}/api/user/getUsers`, {
      userIds,
    });
    const users: any[] = Array.isArray(response.data?.data) ? response.data.data : [];
    const map = new Map<string, string>();
    for (const u of users) {
      if (u.userId && u.email) map.set(u.userId, u.email);
    }
    return map;
  } catch (error) {
    console.error("[userService] Failed to fetch user emails:", error instanceof Error ? error.message : error);
    return new Map();
  }
}
