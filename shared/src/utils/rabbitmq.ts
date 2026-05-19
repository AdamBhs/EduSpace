import amqplib from "amqplib";

const EXCHANGE = "eduspace.events";

let connection: any = null;
let channel: any = null;
let connecting: Promise<any> | null = null;

function getRabbitUrl(): string {
  return process.env.RABBITMQ_URL || "amqp://admin:admin123@localhost:5672";
}

async function getChannel(): Promise<any> {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    connection = await amqplib.connect(getRabbitUrl());
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });

    connection.on("error", (err: any) => {
      console.error("[RabbitMQ] Connection error:", err.message);
    });

    connection.on("close", () => {
      console.warn("[RabbitMQ] Connection closed, will reconnect on next use");
      connection = null;
      channel = null;
      connecting = null;
    });

    console.log("[RabbitMQ] Connected");
    return channel;
  })();

  try {
    return await connecting;
  } catch (err) {
    connecting = null;
    throw err;
  }
}

export async function publishEvent(event: string, payload: Record<string, any>): Promise<void> {
  try {
    const ch = await getChannel();
    ch.publish(
      EXCHANGE,
      event,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: "application/json" },
    );
  } catch (err: any) {
    console.error(`[RabbitMQ] Failed to publish ${event}:`, err.message);
  }
}

export async function subscribeToEvents(
  serviceName: string,
  bindings: string[],
  handler: (event: string, payload: any) => Promise<void>,
): Promise<void> {
  const ch = await getChannel();

  const queue = `${serviceName}.queue`;
  await ch.assertQueue(queue, { durable: true });

  for (const key of bindings) {
    await ch.bindQueue(queue, EXCHANGE, key);
  }

  ch.consume(queue, async (msg: any) => {
    if (!msg) return;

    try {
      const event = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString());
      await handler(event, payload);
      ch.ack(msg);
    } catch (err: any) {
      console.error(`[RabbitMQ] Error processing message in ${serviceName}:`, err.message);
      ch.nack(msg, false, false);
    }
  });

  console.log(`[RabbitMQ] ${serviceName} subscribed to: ${bindings.join(", ")}`);
}
