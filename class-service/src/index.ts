import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

type MaterialCategory =
  | "lessons"
  | "labs"
  | "assignments"
  | "announcements"
  | "other";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const materialCategorySet = new Set<string>([
  "lessons",
  "labs",
  "assignments",
  "announcements",
  "other",
]);

const hasOwn = (value: Record<string, unknown>, key: string): boolean => {
  return Object.prototype.hasOwnProperty.call(value, key);
};

const parseCategories = (value: unknown): MaterialCategory[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value
    .filter((category): category is string => typeof category === "string")
    .map((category) => category.toLowerCase())
    .filter((category): category is MaterialCategory =>
      materialCategorySet.has(category)
    );

  return Array.from(new Set(sanitized));
};

const parsePathParam = (value: string | string[] | undefined): string | null => {
  return typeof value === "string" ? value : null;
};

const parseQueryParam = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (Array.isArray(value)) {
    const first = value.find(
      (item): item is string => typeof item === "string" && item.trim() !== ""
    );
    return first;
  }

  return undefined;
};

const readRequiredString = (
  body: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = body[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const readOptionalString = (
  body: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
};

const readOptionalNullableString = (
  body: Record<string, unknown>,
  key: string
): string | null | undefined => {
  if (!hasOwn(body, key)) {
    return undefined;
  }

  const value = body[key];
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : undefined;
};

const getPrismaErrorCode = (error: unknown): string | null => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
};

app.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", service: "class-service" });
  } catch {
    res
      .status(503)
      .json({ status: "error", service: "class-service", db: "unreachable" });
  }
});

app.post("/api/auth/create_classroom", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = readRequiredString(body, "name");
  const teacherId = readRequiredString(body, "teacherId");

  if (!name || !teacherId) {
    res.status(400).json({
      message: "Validation failed",
      required: ["name", "teacherId"],
    });
    return;
  }

  try {
    const classroom = await prisma.classroom.create({
      data: {
        name,
        teacherId,
        description: readOptionalString(body, "description"),
        subject: readOptionalString(body, "subject"),
        section: readOptionalString(body, "section"),
        chapter: readOptionalString(body, "chapter"),
        materialCategories: parseCategories(body.materialCategories),
      },
    });

    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create classroom",
      details: getPrismaErrorCode(error) ?? "unknown",
    });
  }
});

app.get("/api/classes", async (req: Request, res: Response) => {
  const teacherId = parseQueryParam(req.query.teacherId);
  const subject = parseQueryParam(req.query.subject);

  try {
    const classrooms = await prisma.classroom.findMany({
      where: {
        teacherId,
        subject,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(classrooms);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch classrooms",
      details: getPrismaErrorCode(error) ?? "unknown",
    });
  }
});

app.get("/api/classes/:classId", async (req: Request, res: Response) => {
  const classId = parsePathParam(req.params.classId);
  if (!classId) {
    res.status(400).json({ message: "Invalid classId parameter" });
    return;
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classId },
    });

    if (!classroom) {
      res.status(404).json({ message: "Classroom not found" });
      return;
    }

    res.json(classroom);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch classroom",
      details: getPrismaErrorCode(error) ?? "unknown",
    });
  }
});

app.put("/api/classes/:classId", async (req: Request, res: Response) => {
  const classId = parsePathParam(req.params.classId);
  if (!classId) {
    res.status(400).json({ message: "Invalid classId parameter" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const data: {
    name?: string;
    teacherId?: string;
    description?: string | null;
    subject?: string | null;
    section?: string | null;
    chapter?: string | null;
    materialCategories?: MaterialCategory[];
  } = {};

  if (hasOwn(body, "name")) {
    const name = readRequiredString(body, "name");
    if (!name) {
      res.status(400).json({ message: "Validation failed", required: ["name"] });
      return;
    }
    data.name = name;
  }

  if (hasOwn(body, "teacherId")) {
    const teacherId = readRequiredString(body, "teacherId");
    if (!teacherId) {
      res
        .status(400)
        .json({ message: "Validation failed", required: ["teacherId"] });
      return;
    }
    data.teacherId = teacherId;
  }

  const description = readOptionalNullableString(body, "description");
  if (description !== undefined) {
    data.description = description;
  }

  const subject = readOptionalNullableString(body, "subject");
  if (subject !== undefined) {
    data.subject = subject;
  }

  const section = readOptionalNullableString(body, "section");
  if (section !== undefined) {
    data.section = section;
  }

  const chapter = readOptionalNullableString(body, "chapter");
  if (chapter !== undefined) {
    data.chapter = chapter;
  }

  if (hasOwn(body, "materialCategories")) {
    data.materialCategories = parseCategories(body.materialCategories);
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "No valid fields provided for update" });
    return;
  }

  try {
    const updated = await prisma.classroom.update({
      where: { id: classId },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2025") {
      res.status(404).json({ message: "Classroom not found" });
      return;
    }

    res.status(500).json({
      message: "Failed to update classroom",
      details: getPrismaErrorCode(error) ?? "unknown",
    });
  }
});

app.delete("/api/classes/:classId", async (req: Request, res: Response) => {
  const classId = parsePathParam(req.params.classId);
  if (!classId) {
    res.status(400).json({ message: "Invalid classId parameter" });
    return;
  }

  try {
    const removed = await prisma.classroom.delete({
      where: { id: classId },
    });

    res.json({
      message: "Classroom deleted",
      classId: removed.id,
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2025") {
      res.status(404).json({ message: "Classroom not found" });
      return;
    }

    res.status(500).json({
      message: "Failed to delete classroom",
      details: getPrismaErrorCode(error) ?? "unknown",
    });
  }
});

const PORT = parseInt(process.env.PORT || "3003", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Class service running on http://localhost:${PORT}`);
});

const shutdown = async (): Promise<void> => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
