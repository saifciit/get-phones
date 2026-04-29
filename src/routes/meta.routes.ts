import { Router } from "express";
import { MetaController } from "../controllers/meta.controller";

const router = Router();

router.get("/meta", MetaController.getMetaData);

export default router;
