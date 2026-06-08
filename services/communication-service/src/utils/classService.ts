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
  } catch (error) {
    console.error("[classService] Failed to check membership:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function checkFriendship(
  userId1: string,
  userId2: string,
): Promise<boolean> {
  try {
    const response = await axios.get(
      `${CLASS_SERVICE_URL}/api/classroom/internal/check-friendship/${userId1}/${userId2}`,
    );
    return response.data?.data?.isFriend ?? false;
  } catch (error) {
    console.error("[classService] Failed to check friendship:", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getSharedMembers(userId: string): Promise<string[]> {
  try {
    const response = await axios.get(
      `${CLASS_SERVICE_URL}/api/classroom/internal/shared-members/${userId}`,
    );
    return response.data?.data ?? [];
  } catch (error) {
    console.error("[classService] Failed to get shared members:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function fetchMemberIds(classId: string): Promise<string[]> {
  try {
    const response = await axios.get(
      `${CLASS_SERVICE_URL}/api/classroom/internal/${classId}/member-ids`,
    );
    return response.data?.data?.allIds ?? [];
  } catch (error) {
    console.error("[classService] Failed to fetch member IDs:", error instanceof Error ? error.message : error);
    return [];
  }
}
