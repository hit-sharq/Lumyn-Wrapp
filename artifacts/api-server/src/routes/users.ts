import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { SyncUserBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/sync", async (req, res) => {
  const parsed = SyncUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad request", message: "Invalid request body" });
    return;
  }

  const { clerkId, email, name, imageUrl } = parsed.data;

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });

  let user;
  if (existing) {
    const updated = await db
      .update(usersTable)
      .set({ email, name, imageUrl: imageUrl ?? null, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    user = updated[0];
  } else {
    const created = await db
      .insert(usersTable)
      .values({ clerkId, email, name, imageUrl: imageUrl ?? null })
      .returning();
    user = created[0];
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
