// ─── Enums (mirrored from Prisma for use in frontend + shared logic) ─────

export enum ClassroomType {
  TEACHING = "TEACHING",
  FRIENDLY = "FRIENDLY",
}

export enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum PostType {
  STUDY_MATERIAL = "STUDY_MATERIAL",
  QUIZ = "QUIZ",
  QUESTION = "QUESTION",
  ASSIGNMENT = "ASSIGNMENT",
  ANNOUNCEMENT = "ANNOUNCEMENT",
}

export enum StudyMaterialType {
  COURS = "COURS",
  TD = "TD",
  TP = "TP",
  RESUME = "RESUME",
}

// ─── RabbitMQ Event Names ────────────────────────────────────

export const Events = {
  CLASSROOM_CREATED: "classroom.created",
  CLASSROOM_DELETED: "classroom.deleted",
  CLASSROOM_UPDATED: "classroom.updated",
  CHAT_TOGGLED: "chat.toggled",
  MEMBER_JOINED: "member.joined",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role.changed",
  POST_CREATED: "post.created",
  POST_UPDATED: "post.updated",
  POST_DELETED: "post.deleted",
  SUBMISSION_GRADED: "submission.graded",
  CHAT_MESSAGE: "chat.message",
} as const;

// ─── Display labels per classroom type ───────────────────────

export const RoleLabels = {
  [ClassroomType.TEACHING]: {
    [Role.ADMIN]: "Teacher",
    [Role.MEMBER]: "Student",
    adminPlural: "Teachers",
    memberPlural: "Students",
  },
  [ClassroomType.FRIENDLY]: {
    [Role.ADMIN]: "Admin",
    [Role.MEMBER]: "Member",
    adminPlural: "Admins",
    memberPlural: "Members",
  },
} as const;
