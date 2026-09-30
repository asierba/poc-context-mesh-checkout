import { Kafka } from "kafkajs";
import { Pool } from "pg";

const BATCH_SIZE = 100;
const POLL_INTERVAL_MS = 500;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const producer = new Kafka({
  clientId: "checkout-outbox-relay",
  brokers: (process.env.KAFKA_BROKERS ?? "").split(","),
}).producer({ idempotent: true });

async function relayBatch(): Promise<number> {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const { rows } = await db.query(
      `SELECT id, topic, payload, created_at FROM outbox
       WHERE published_at IS NULL ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED`,
      [BATCH_SIZE],
    );
    for (const row of rows) {
      await producer.send({
        topic: row.topic,
        messages: [{ key: row.payload.order_id, value: JSON.stringify(toCloudEvent(row)) }],
      });
      await db.query("UPDATE outbox SET published_at = now() WHERE id = $1", [row.id]);
    }
    await db.query("COMMIT");
    return rows.length;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

function toCloudEvent(row: { id: string; topic: string; payload: unknown; created_at: Date }) {
  return {
    specversion: "1.0",
    id: row.id,
    source: "checkout-service",
    type: row.topic,
    time: row.created_at.toISOString(),
    dataschema: `acme://schemas/${row.topic}/v2`,
    data: row.payload,
  };
}

async function main() {
  await producer.connect();
  for (;;) {
    const published = await relayBatch();
    if (published === 0) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

main();
