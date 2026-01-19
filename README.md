# ReachInbox Email Scheduler – Backend

Backend API and job processing service for the ReachInbox Email Scheduler, built with **Express.js**, **Prisma**, **BullMQ**, and **Redis**, deployed on **Render**.

## 🌐 Live API URL

https://task-backend-9w9u.onrender.com

## 🎥 Demo Video

https://drive.google.com/file/d/1R84QJ8EQ8uVA1SPu6TxYnsSF9KoeRf2s/view?usp=drivesdk

---

## 🧰 Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Passport.js (Google OAuth)
- Nodemailer (Ethereal SMTP)

---

## ✨ Features

- Google OAuth authentication
- JWT-based API security
- Email scheduling with delays
- Background job processing (BullMQ)
- Rate limiting per user (hourly)
- Retry & backoff for failed jobs
- Persistent job queue
- Redis-based idempotency
- Prisma migrations

---

## ⚙️ Environment Variables

Set these in **Render → Environment Variables**:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
REDIS_URL=redis://HOST:PORT

SESSION_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=https://task-backend-9w9u.onrender.com/auth/google/callback

ETHEREAL_USER=ethereal_user
ETHEREAL_PASS=ethereal_pass

FRONTEND_URL=https://task-brown-gamma.vercel.app
PORT=10000
```

---

## 🛠 Local Development

```bash
git clone https://github.com/BismarckSVBP/task-backend
cd server
npm install
npx prisma db push
npm run dev:server
```

Worker (local):

```bash
npm run dev:worker
```

---

## 🔁 Background Worker (Free Tier Solution)

Render free tier does **not support separate background workers**.

✅ **Solution used in this project:**

- BullMQ worker runs **inside the main API process**
- Worker starts automatically when server starts
- Ensures free & reliable background job execution

```ts
new Worker("email-queue", sendEmailProcessor, { connection });
```

This approach is production-safe for small to medium workloads and ideal for assignments.

---

## 🗄 Database

- PostgreSQL (Render managed)
- Prisma ORM
- Auto migrations using:

```bash
prisma migrate deploy
```

---

## 🚀 Deployment

- Platform: **Render**
- Service Type: Web Service
- Build Command:
  ```bash
  npm install && npm run build
  ```
- Start Command:
  ```bash
  npm run start
  ```

---

## 📌 Notes

- Emails use **Ethereal SMTP** (fake emails for testing)
- Preview URLs are logged in backend console
- Queue survives server restarts
- Rate limits enforced per user

---

## 👤 Author

**Abhay Kumar**  
GitHub: https://github.com/BismarckSVBP
