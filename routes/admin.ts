import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  renderAddPet,
  renderAdminHome,
  renderHistory,
  renderRequests,
} from "../controllers/admin";
export const adminRouter = express.Router();
adminRouter.route("/").get(renderAdminHome);
adminRouter.route("/add_pet").get(renderAddPet);
adminRouter.route("/requests").get(renderRequests);
adminRouter.route("/history").get(renderHistory);
