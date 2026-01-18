import { Queue } from "bullmq";
import prisma from "../utils/prisma";
import { getBullMQConnection } from "../utils/redis";

const connection = getBullMQConnection();

export const emailQueue = new Queue("email-queue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

export async function requeuePendingEmails() {
  await prisma.emailJob.updateMany({
    where: { status: "processing" },
    data: { status: "scheduled" },
  });

  const jobs = await prisma.emailJob.findMany({
    where: {
      status: "scheduled",
      queued: false,
      scheduledAt: { gt: new Date() },
    },
  });

  for (const job of jobs) {
    await emailQueue.add(
      "send-email",
      { emailJobId: job.id },
      {
        delay: job.scheduledAt.getTime() - Date.now(),
        attempts: 1,
      }
    );

    await prisma.emailJob.update({
      where: { id: job.id },
      data: { queued: true },
    });
  }

  console.log(`Requeued ${jobs.length} unqueued emails`);
}
