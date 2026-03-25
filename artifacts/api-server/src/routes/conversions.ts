import { Router, type IRouter } from "express";
import { db, usersTable, conversionJobsTable, subscriptionsTable, plansTable } from "@workspace/db";
import { CreateConversionBody } from "@workspace/api-zod";
import { eq, desc, and, gte, count } from "drizzle-orm";

const router: IRouter = Router();

function serializeJob(job: typeof conversionJobsTable.$inferSelect) {
  return {
    id: job.id,
    userId: job.userId,
    webUrl: job.webUrl,
    appName: job.appName,
    packageName: job.packageName,
    versionName: job.versionName,
    status: job.status,
    apkDownloadUrl: job.apkDownloadUrl,
    errorMessage: job.errorMessage,
    enableOffline: job.enableOffline,
    enablePushNotifications: job.enablePushNotifications,
    splashScreenColor: job.splashScreenColor,
    themeColor: job.themeColor,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

async function simulateConversion(jobId: string) {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await db
    .update(conversionJobsTable)
    .set({ status: "processing" })
    .where(eq(conversionJobsTable.id, jobId));

  await new Promise((resolve) => setTimeout(resolve, 12000));

  await db
    .update(conversionJobsTable)
    .set({
      status: "completed",
      apkDownloadUrl: `https://storage.lumyntechnologies.com/apks/${jobId}/app-release.apk`,
      completedAt: new Date(),
    })
    .where(eq(conversionJobsTable.id, jobId));
}

router.get("/", async (req, res) => {
  const clerkId = req.headers["x-clerk-user-id"] as string;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized", message: "Missing authentication" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });

  if (!user) {
    res.status(404).json({ error: "Not found", message: "User not found" });
    return;
  }

  const jobs = await db
    .select()
    .from(conversionJobsTable)
    .where(eq(conversionJobsTable.userId, user.id))
    .orderBy(desc(conversionJobsTable.createdAt));

  res.json(jobs.map(serializeJob));
});

router.post("/", async (req, res) => {
  const clerkId = req.headers["x-clerk-user-id"] as string;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized", message: "Missing authentication" });
    return;
  }

  const parsed = CreateConversionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad request", message: "Invalid request body" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });

  if (!user) {
    res.status(404).json({ error: "Not found", message: "User not found" });
    return;
  }

  const now = new Date();
  const subscription = await db.query.subscriptionsTable.findFirst({
    where: and(
      eq(subscriptionsTable.userId, user.id),
      eq(subscriptionsTable.status, "active"),
      gte(subscriptionsTable.currentPeriodEnd, now)
    ),
  });

  if (!subscription) {
    res.status(403).json({ error: "Subscription required", message: "An active subscription is required to convert apps" });
    return;
  }

  const plan = await db.query.plansTable.findFirst({
    where: eq(plansTable.id, subscription.planId),
  });

  if (plan && plan.conversionsPerMonth !== -1) {
    const [result] = await db
      .select({ count: count() })
      .from(conversionJobsTable)
      .where(
        and(
          eq(conversionJobsTable.userId, user.id),
          gte(conversionJobsTable.createdAt, subscription.currentPeriodStart)
        )
      );

    const used = result?.count ?? 0;
    if (used >= plan.conversionsPerMonth) {
      res.status(403).json({
        error: "Limit reached",
        message: `You have used all ${plan.conversionsPerMonth} conversions for this period. Upgrade your plan for more.`,
      });
      return;
    }
  }

  const data = parsed.data;
  const [job] = await db
    .insert(conversionJobsTable)
    .values({
      userId: user.id,
      webUrl: data.webUrl,
      appName: data.appName,
      packageName: data.packageName,
      versionName: data.versionName ?? "1.0.0",
      enableOffline: data.enableOffline ?? false,
      enablePushNotifications: data.enablePushNotifications ?? false,
      splashScreenColor: data.splashScreenColor ?? null,
      themeColor: data.themeColor ?? null,
    })
    .returning();

  simulateConversion(job.id).catch(console.error);

  res.status(201).json(serializeJob(job));
});

router.get("/:id", async (req, res) => {
  const clerkId = req.headers["x-clerk-user-id"] as string;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized", message: "Missing authentication" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });

  if (!user) {
    res.status(404).json({ error: "Not found", message: "User not found" });
    return;
  }

  const job = await db.query.conversionJobsTable.findFirst({
    where: and(
      eq(conversionJobsTable.id, req.params.id),
      eq(conversionJobsTable.userId, user.id)
    ),
  });

  if (!job) {
    res.status(404).json({ error: "Not found", message: "Conversion job not found" });
    return;
  }

  res.json(serializeJob(job));
});

router.get("/:id/status", async (req, res) => {
  const clerkId = req.headers["x-clerk-user-id"] as string;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized", message: "Missing authentication" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });

  if (!user) {
    res.status(404).json({ error: "Not found", message: "User not found" });
    return;
  }

  const job = await db.query.conversionJobsTable.findFirst({
    where: and(
      eq(conversionJobsTable.id, req.params.id),
      eq(conversionJobsTable.userId, user.id)
    ),
  });

  if (!job) {
    res.status(404).json({ error: "Not found", message: "Conversion job not found" });
    return;
  }

  res.json({
    id: job.id,
    status: job.status,
    apkDownloadUrl: job.apkDownloadUrl,
    errorMessage: job.errorMessage,
    completedAt: job.completedAt?.toISOString() ?? null,
  });
});

export default router;
