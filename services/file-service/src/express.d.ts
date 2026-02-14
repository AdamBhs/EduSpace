import "express";

declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
    user?: { userId: string; email?: string };
  }
}
