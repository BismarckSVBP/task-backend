import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { emailQueue } from "../services/queue";

export async function scheduleEmail(req: Request, res: Response) {
  const user = req.user as { id: string };
  const {
    recipients,
    subject,
    body,
    startTime,
    delayBetweenEmails,
    fromEmail,
    attachments,
  } = req.body;

  let nextTime = new Date(startTime).getTime();

  for (let i = 0; i < recipients.length; i++) {
    const job = await prisma.emailJob.create({
      data: {
        userId: user.id,
        recipient: recipients[i],
        subject,
        body,
        status: "scheduled",
        scheduledAt: new Date(nextTime),
        sequenceNumber: i,
        queued: false,
        fromEmail,
        attachments: attachments ?? "[]",
      },
    });

    await emailQueue.add(
      "send-email",
      { emailJobId: job.id },
      { delay: nextTime - Date.now() }
    );

    await prisma.emailJob.update({
      where: { id: job.id },
      data: { queued: true },
    });

    nextTime += delayBetweenEmails;
  }

  res.json({ success: true });
}
