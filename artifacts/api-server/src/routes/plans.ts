import { Router, type IRouter } from "express";
import { db, plansTable } from "@workspace/db";

const router: IRouter = Router();

const SEED_PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceUsd: 19,
    conversionsPerMonth: 3,
    features: [
      "3 APK conversions/month",
      "Custom app name & package",
      "Splash screen customization",
      "Email support",
      "Standard processing speed",
    ],
    popular: "false",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    conversionsPerMonth: 15,
    features: [
      "15 APK conversions/month",
      "Custom app name & package",
      "Splash screen & theme customization",
      "Offline mode support",
      "Priority processing speed",
      "Priority email support",
    ],
    popular: "true",
  },
  {
    id: "business",
    name: "Business",
    priceUsd: 99,
    conversionsPerMonth: -1,
    features: [
      "Unlimited APK conversions",
      "Custom app name & package",
      "Full branding customization",
      "Offline mode support",
      "Push notification support",
      "Fastest processing speed",
      "Dedicated support",
    ],
    popular: "false",
  },
];

async function seedPlans() {
  for (const plan of SEED_PLANS) {
    await db
      .insert(plansTable)
      .values(plan)
      .onConflictDoUpdate({
        target: plansTable.id,
        set: {
          name: plan.name,
          priceUsd: plan.priceUsd,
          conversionsPerMonth: plan.conversionsPerMonth,
          features: plan.features,
          popular: plan.popular,
        },
      });
  }
}

seedPlans().catch(console.error);

router.get("/", async (_req, res) => {
  const plans = await db.select().from(plansTable);

  const ordered = ["starter", "pro", "business"]
    .map((id) => plans.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({
      id: p!.id,
      name: p!.name,
      priceUsd: p!.priceUsd,
      conversionsPerMonth: p!.conversionsPerMonth,
      features: p!.features,
      popular: p!.popular === "true",
    }));

  res.json(ordered);
});

export default router;
