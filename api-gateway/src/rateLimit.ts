import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { sendError } from "../../shared/src/utils/response";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });

  redis.connect().catch(() => {
    console.warn("Redis unavailable — rate limiting disabled");
  });

  // Keep the client on errors — ioredis reconnects on its own; replacing
  // it here would leak a new connection per error
  redis.on("error", () => {});

  return redis;
}

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client = getRedis();
  if (!client) return next();

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `rl:${ip}`;

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.pexpire(key, WINDOW_MS);
    }

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - count));

    if (count > MAX_REQUESTS) {
      return sendError(res, "Too many requests", 429);
    }

    next();
  } catch {
    next();
  }
};
