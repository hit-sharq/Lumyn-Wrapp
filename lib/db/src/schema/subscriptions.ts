import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const plansTable = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceUsd: real("price_usd").notNull(),
  conversionsPerMonth: integer("conversions_per_month").notNull(),
  features: text("features").array().notNull().default([]),
  popular: text("popular").notNull().default("false"),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => plansTable.id),
  status: text("status", { enum: ["active", "cancelled", "expired", "pending"] }).notNull().default("pending"),
  pesapalOrderTrackingId: text("pesapal_order_tracking_id"),
  pesapalMerchantReference: text("pesapal_merchant_reference"),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Plan = typeof plansTable.$inferSelect;
