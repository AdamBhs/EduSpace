import axios from "axios";

const CLASS_SERVICE_URL =
  process.env.CLASS_SERVICE_URL || "http://localhost:3003";

export async function checkMembership(
  classId: string,
  userId: string,
  authHeader?: string,
): Promise<boolean> {
  try {
    const response = await axios.get(
      `${CLASS_SERVICE_URL}/api/classroom/${classId}/members/check/${userId}`,
      {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    );
    return response.data?.success === true;
  } catch (error) {
    console.error("[classService] Failed to check membership:", error instanceof Error ? error.message : error);
    return false;
  }
}
