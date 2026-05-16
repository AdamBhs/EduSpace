import axios from "axios";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3002";

export async function fetchUsers(
  userIds: string[],
  authHeader?: string,
): Promise<any[]> {
  if (userIds.length === 0) return [];

  try {
    const response = await axios.post(
      `${USER_SERVICE_URL}/api/user/getUsers`,
      { userIds },
      {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch {
    return [];
  }
}
