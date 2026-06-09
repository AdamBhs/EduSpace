import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const publisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

publisher.connect().catch((err) => {
  console.error("Redis publisher connection failed:", err.message);
});

const CHANNEL = "notifications";

export async function pushNotification(userId: string, notification: any): Promise<void> {
  await publisher.publish(
    `${CHANNEL}:${userId}`,
    JSON.stringify(notification),
  );
}

export function createSubscriber(): Redis {
  return new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
}

export function channelForUser(userId: string): string {
  return `${CHANNEL}:${userId}`;
}
