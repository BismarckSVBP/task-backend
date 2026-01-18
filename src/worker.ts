import { Worker } from "bullmq";
import { sendEmailProcessor } from "./services/mailer";
import { getBullMQConnection } from "./utils/redis";

const connection = getBullMQConnection();

new Worker(
  "email-queue",
  sendEmailProcessor,
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    limiter: {
      max: 1,
      duration: Number(process.env.MIN_DELAY_MS ?? 2000),
    },
  }
);

console.log("Email worker running");
