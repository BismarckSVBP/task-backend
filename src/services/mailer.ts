
import nodemailer from 'nodemailer';
import prisma from '../utils/prisma';
import { redis } from '../utils/redis';
import { emailQueue } from './queue';

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER!,
    pass: process.env.ETHEREAL_PASS!,
  },
});

export async function sendEmailProcessor(job: any) {
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: job.data.emailJobId },
    include: { user: true },
  });

  if (!emailJob) return;

  // 🔐 Idempotency lock
  const locked = await prisma.emailJob.updateMany({
    where: { id: emailJob.id, status: 'scheduled' },
    data: { status: 'processing' },
  });

  if (locked.count === 0) return;

  const now = new Date();
  const hourKey = `rate:${emailJob.userId}:${now.toISOString().slice(0, 13)}`;

  const currentCount = Number((await redis.get(hourKey)) || 0);

  // 🚦 Rate limit exceeded → reschedule safely
  if (currentCount >= emailJob.user.hourlyLimit) {
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: 'scheduled',
        scheduledAt: nextHour,
      },
    });

    await emailQueue.add(
      'send-email',
      { emailJobId: emailJob.id },
      { delay: nextHour.getTime() - Date.now(), attempts: 1 }
    );

    return;
  }

  //  Increment only when actually sending
  await redis.multi().incr(hourKey).expire(hourKey, 3600).exec();

  try {
    const fromEmail = emailJob.fromEmail || emailJob.user.email;
    const info = await transporter.sendMail({
      from: `"ReachInbox" <${fromEmail}>`, 
      to: emailJob.recipient,
      subject: emailJob.subject,
      text: emailJob.body,
      html: emailJob.body, // Support HTML from rich text editor
    });

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        messageId: info.messageId,
      },
    });
  } catch (err) {
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { status: 'failed' },
    });
    throw err;
  }
}
