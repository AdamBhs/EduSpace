import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { sendError } from "../utils/response";

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return sendError(res, JSON.stringify(errorMessage), 400);
      }
      return sendError(res, "Validation error", 400);
    }
  };
};
