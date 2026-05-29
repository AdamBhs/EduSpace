import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.connect().catch((err) => {
  console.error("Redis connection failed:", err.message);
});

const PRESENCE_PREFIX = "presence:";
const PRESENCE_TTL = 120;

export async function setOnline(userId: string, socketId: string): Promise<void> {
  await redis.set(`${PRESENCE_PREFIX}${userId}`, socketId, "EX", PRESENCE_TTL);
}

export async function setOffline(userId: string): Promise<void> {
  await redis.del(`${PRESENCE_PREFIX}${userId}`);
}

export async function isOnline(userId: string): Promise<boolean> {
  const result = await redis.exists(`${PRESENCE_PREFIX}${userId}`);
  return result === 1;
}

export async function getOnlineUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const pipeline = redis.pipeline();
  for (const id of userIds) {
    pipeline.exists(`${PRESENCE_PREFIX}${id}`);
  }
  const results = await pipeline.exec();
  if (!results) return [];
  return userIds.filter((_, i) => results[i]?.[1] === 1);
}

export async function refreshPresence(userId: string): Promise<void> {
  await redis.expire(`${PRESENCE_PREFIX}${userId}`, PRESENCE_TTL);
}
