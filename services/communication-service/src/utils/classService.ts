import axios from "axios";

const CLASS_SERVICE_URL =
  process.env.CLASS_SERVICE_URL || "http://localhost:3003";

export interface MembershipInfo {
  role: "ADMIN" | "MEMBER";
  classroomType: "TEACHING" | "FRIENDLY";
  isCreator: boolean;
}

export async function checkMembership(
  classId: string,
  userId: string,
  authHeader?: string,
): Promise<MembershipInfo | null> {
  try {
    const response = await axios.get(
      `${CLASS_SERVICE_URL}/api/classroom/${classId}/members/check/${userId}`,
      {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    );
    return response.data?.data ?? null;
  } catch {
    return null;
  }
}
