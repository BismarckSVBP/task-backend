// import { Request, Response } from "express";
// import prisma from "../utils/prisma";
// import { emailQueue } from "../services/queue";

// export async function scheduleEmail(req: Request, res: Response) {
//   const user = req.user as { id: string };
//   const {
//     recipients,
//     subject,
//     body,
//     startTime,
//     delayBetweenEmails,
//     fromEmail,
//     attachments,
//   } = req.body;

//   let nextTime = new Date(startTime).getTime();

//   for (let i = 0; i < recipients.length; i++) {
//     const job = await prisma.emailJob.create({
//       data: {
//         userId: user.id,
//         recipient: recipients[i],
//         subject,
//         body,
//         status: "scheduled",
//         scheduledAt: new Date(nextTime),
//         sequenceNumber: i,
//         queued: false,
//         fromEmail,
//         attachments: attachments ?? "[]",
//       },
//     });

//     await emailQueue.add(
//       "send-email",
//       { emailJobId: job.id },
//       { delay: nextTime - Date.now() }
//     );

//     await prisma.emailJob.update({
//       where: { id: job.id },
//       data: { queued: true },
//     });

//     nextTime += delayBetweenEmails;
//   }

//   res.json({ success: true });
// }

import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { emailQueue } from "../services/queue";

/**
 * Schedule emails with delay between each recipient
 */
export async function scheduleEmail(req: Request, res: Response) {
  try {
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

    if (!recipients?.length) {
      return res.status(400).json({ message: "Recipients are required" });
    }

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
        {
          delay: Math.max(nextTime - Date.now(), 0), // prevents negative delay
        }
      );

      await prisma.emailJob.update({
        where: { id: job.id },
        data: { queued: true },
      });

      nextTime += delayBetweenEmails;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Schedule Email Error:", error);
    res.status(500).json({ message: "Failed to schedule emails" });
  }
}

/**
 * Get all scheduled (future) emails
 */
export async function getScheduledEmails(req: Request, res: Response) {
  try {
    const user = req.user as { id: string };

    const emails = await prisma.emailJob.findMany({
      where: {
        userId: user.id,
        status: "scheduled",
      },
      orderBy: [
        { scheduledAt: "asc" },
        { sequenceNumber: "asc" },
      ],
    });

    res.json(emails);
  } catch (error) {
    console.error("Get Scheduled Emails Error:", error);
    res.status(500).json({ message: "Failed to fetch scheduled emails" });
  }
}

/**
 * Get sent + failed emails
 */
export async function getSentEmails(req: Request, res: Response) {
  try {
    const user = req.user as { id: string };

    const emails = await prisma.emailJob.findMany({
      where: {
        userId: user.id,
        status: { in: ["sent", "failed"] },
      },
      orderBy: { sentAt: "desc" },
    });

    res.json(emails);
  } catch (error) {
    console.error("Get Sent Emails Error:", error);
    res.status(500).json({ message: "Failed to fetch sent emails" });
  }
}
