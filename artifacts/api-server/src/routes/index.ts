import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import plansRouter from "./plans";
import subscriptionsRouter from "./subscriptions";
import conversionsRouter from "./conversions";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/plans", plansRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/conversions", conversionsRouter);

export default router;
