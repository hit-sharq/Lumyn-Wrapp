import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const conversionJobsTable = pgTable("conversion_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  webUrl: text("web_url").notNull(),
  appName: text("app_name").notNull(),
  packageName: text("package_name").notNull(),
  versionName: text("version_name").notNull().default("1.0.0"),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  apkDownloadUrl: text("apk_download_url"),
  errorMessage: text("error_message"),
  enableOffline: boolean("enable_offline").notNull().default(false),
  enablePushNotifications: boolean("enable_push_notifications").notNull().default(false),
  splashScreenColor: text("splash_screen_color"),
  themeColor: text("theme_color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertConversionJobSchema = createInsertSchema(conversionJobsTable).omit({ id: true, createdAt: true });
export type InsertConversionJob = z.infer<typeof insertConversionJobSchema>;
export type ConversionJob = typeof conversionJobsTable.$inferSelect;
