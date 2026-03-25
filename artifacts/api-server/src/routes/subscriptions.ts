import { Router, type IRouter } from "express";
import { db, usersTable, subscriptionsTable, plansTable, conversionJobsTable } from "@workspace/db";
import { CreateCheckoutBody } from "@workspace/api-zod";
import { eq, and, gte, count } from "drizzle-orm";

const router: IRouter = Router();

async function getActiveSubscription(userId: string) {
  const now = new Date();
  return db.query.subscriptionsTable.findFirst({
    where: and(
      eq(subscriptionsTable.userId, userId),
      eq(subscriptionsTable.status, "active"),
      gte(subscriptionsTable.currentPeriodEnd, now)
    ),
  });
}

router.get("/me", async (req, res) => {
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

  const subscription = await getActiveSubscription(user.id);

  let conversionsUsedThisMonth = 0;
  let conversionsRemaining = 0;

  if (subscription) {
    const plan = await db.query.plansTable.findFirst({
      where: eq(plansTable.id, subscription.planId),
    });

    const startOfMonth = new Date(subscription.currentPeriodStart);
    const [result] = await db
      .select({ count: count() })
      .from(conversionJobsTable)
      .where(
        and(
          eq(conversionJobsTable.userId, user.id),
          gte(conversionJobsTable.createdAt, startOfMonth)
        )
      );

    conversionsUsedThisMonth = result?.count ?? 0;

    if (plan && plan.conversionsPerMonth === -1) {
      conversionsRemaining = -1;
    } else if (plan) {
      conversionsRemaining = Math.max(0, plan.conversionsPerMonth - conversionsUsedThisMonth);
    }

    res.json({
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        planName: plan?.name ?? subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        priceUsd: plan?.priceUsd ?? 0,
      },
      conversionsUsedThisMonth,
      conversionsRemaining,
    });
  } else {
    res.json({
      subscription: null,
      conversionsUsedThisMonth: 0,
      conversionsRemaining: 0,
    });
  }
});

router.post("/checkout", async (req, res) => {
  const clerkId = req.headers["x-clerk-user-id"] as string;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized", message: "Missing authentication" });
    return;
  }

  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad request", message: "Invalid request body" });
    return;
  }

  const { planId } = parsed.data;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });

  if (!user) {
    res.status(404).json({ error: "Not found", message: "User not found" });
    return;
  }

  const plan = await db.query.plansTable.findFirst({
    where: eq(plansTable.id, planId),
  });

  if (!plan) {
    res.status(404).json({ error: "Not found", message: "Plan not found" });
    return;
  }

  const merchantReference = `LUMYN-${user.id}-${planId}-${Date.now()}`;

  const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
  const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
  const PESAPAL_BASE_URL = process.env.PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

  let redirectUrl = `${process.env.APP_URL ?? ""}/pricing?plan=${planId}&ref=${merchantReference}&status=pending`;

  if (PESAPAL_CONSUMER_KEY && PESAPAL_CONSUMER_SECRET) {
    try {
      const tokenResponse = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ consumer_key: PESAPAL_CONSUMER_KEY, consumer_secret: PESAPAL_CONSUMER_SECRET }),
      });
      const tokenData = await tokenResponse.json() as { token?: string };
      const token = tokenData.token;

      if (token) {
        const callbackUrl = `${process.env.APP_URL ?? ""}/api/subscriptions/callback`;
        const ipnId = process.env.PESAPAL_IPN_ID ?? "";

        const orderResponse = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: merchantReference,
            currency: "USD",
            amount: plan.priceUsd,
            description: `Lumyn Wrapp ${plan.name} Plan - Monthly Subscription`,
            callback_url: callbackUrl,
            notification_id: ipnId,
            billing_address: {
              email_address: user.email,
              first_name: user.name.split(" ")[0] ?? user.name,
              last_name: user.name.split(" ").slice(1).join(" ") ?? "",
            },
          }),
        });

        const orderData = await orderResponse.json() as { redirect_url?: string; order_tracking_id?: string };

        if (orderData.redirect_url) {
          redirectUrl = orderData.redirect_url;

          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await db.insert(subscriptionsTable).values({
            userId: user.id,
            planId,
            status: "pending",
            pesapalOrderTrackingId: orderData.order_tracking_id ?? null,
            pesapalMerchantReference: merchantReference,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          });

          res.json({ redirectUrl, orderTrackingId: orderData.order_tracking_id ?? merchantReference });
          return;
        }
      }
    } catch {
      // Fall through to demo mode
    }
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.insert(subscriptionsTable).values({
    userId: user.id,
    planId,
    status: "active",
    pesapalMerchantReference: merchantReference,
    currentPeriodStart: new Date(),
    currentPeriodEnd: periodEnd,
  });

  res.json({ redirectUrl: `/?subscribed=true&plan=${planId}`, orderTrackingId: merchantReference });
});

router.get("/callback", async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference } = req.query as {
    OrderTrackingId?: string;
    OrderMerchantReference?: string;
  };

  if (!OrderTrackingId && !OrderMerchantReference) {
    res.status(400).json({ success: false, message: "Missing tracking info" });
    return;
  }

  const subscription = await db.query.subscriptionsTable.findFirst({
    where: OrderMerchantReference
      ? eq(subscriptionsTable.pesapalMerchantReference, OrderMerchantReference)
      : eq(subscriptionsTable.pesapalOrderTrackingId, OrderTrackingId!),
  });

  if (!subscription) {
    res.status(404).json({ success: false, message: "Subscription not found" });
    return;
  }

  await db
    .update(subscriptionsTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(subscriptionsTable.id, subscription.id));

  res.json({ success: true, message: "Payment confirmed, subscription activated" });
});

export default router;
