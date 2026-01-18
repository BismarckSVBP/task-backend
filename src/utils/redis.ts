// import Redis from 'ioredis';

// // Parse REDIS_URL or use REDIS_HOST/REDIS_PORT for backward compatibility
// function getRedisConnection() {
//   if (process.env.REDIS_URL) {
//     // Parse REDIS_URL (format: redis://[:password@]host[:port][/db-number])
//     return new Redis(process.env.REDIS_URL, {
//       maxRetriesPerRequest: null,
//       enableReadyCheck: false,
//     });
//   } else {
//     // Fallback to REDIS_HOST/REDIS_PORT for local development
//     return new Redis({
//       host: process.env.REDIS_HOST || 'localhost',
//       port: Number(process.env.REDIS_PORT || 6379),
//       maxRetriesPerRequest: null,
//       enableReadyCheck: false,
//     });
//   }
// }

// export const redis = getRedisConnection();

// // Get connection config for BullMQ (supports both URL and host/port)
// export function getBullMQConnection() {
//   if (process.env.REDIS_URL) {
//     return process.env.REDIS_URL;
//   } else {
//     return {
//       host: process.env.REDIS_HOST || 'localhost',
//       port: Number(process.env.REDIS_PORT || 6379),
//     };
//   }
// }
import Redis from "ioredis";
import { ConnectionOptions } from "bullmq";

let redis: Redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export { redis };

/**
 * BullMQ must receive connection OPTIONS (not Redis instance)
 */
export function getBullMQConnection(): ConnectionOptions {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
    };
  }

  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
  };
}
