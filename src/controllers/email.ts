
import prisma from '../utils/prisma';
import { emailQueue } from '../services/queue';

export async function scheduleEmail(req: any, res: any) {
  const { recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit, fromEmail, attachments } = req.body;
  const userId = req.user.id;

  // Validate start time is in the future
  const startDate = new Date(startTime);
  if (startDate <= new Date()) {
    return res.status(400).json({ error: "Start time must be in the future" });
  }

  // Update user's hourly limit if provided
  if (hourlyLimit) {
    await prisma.user.update({
      where: { id: userId },
      data: { hourlyLimit: Number(hourlyLimit) },
    });
  }

  let nextTime = new Date(startTime).getTime();

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < recipients.length; i++) {
      const emailJob = await tx.emailJob.create({
        data: {
          userId,
          recipient: recipients[i],
          subject,
          body,
          status: 'scheduled',
          scheduledAt: new Date(nextTime),
          sequenceNumber: i,
          queued: false,
          fromEmail: fromEmail || undefined,
          attachments: attachments || "[]",
        },
      });

      await emailQueue.add(
        'send-email',
        { emailJobId: emailJob.id }, 
        { delay: nextTime - Date.now(), attempts: 1 }
      );

      await tx.emailJob.update({
        where: { id: emailJob.id },
        data: { queued: true },
      });

      nextTime += delayBetweenEmails;
    }
  });

  res.json({ success: true, count: recipients.length });
}

export async function getScheduledEmails(req: any, res: any) {
  const emails = await prisma.emailJob.findMany({
    where: {
      userId: req.user.id,
      status: 'scheduled',
    },
    orderBy: [{ scheduledAt: 'asc' }, { sequenceNumber: 'asc' }],
  });

  res.json(emails);
}

export async function getSentEmails(req: any, res: any) {
  const emails = await prisma.emailJob.findMany({
    where: {
      userId: req.user.id,
      status: { in: ['sent', 'failed'] },
    },
    orderBy: { sentAt: 'desc' },
  });

  res.json(emails);
}
