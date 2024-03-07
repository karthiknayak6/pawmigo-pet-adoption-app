import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  acceptAdopt,
  addPet,
  adminLogin,
  adminSignup,
  deletePet,
  rejectRequest,
  renderAddPet,
  renderAdminHome,
  renderAdminLogin,
  renderAdminSignup,
  renderHistory,
  renderRequests,
  renderShowPet,
} from "../controllers/admin";

import multer from "multer";
import path from "path";
import { isAdminLoggedIn, isLoggedIn } from "../middlewares/auth";
import { adoptPet } from "../controllers/admin";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/pet_images");
  },

  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
export const adminRouter = express.Router();
adminRouter.route("/").get(isAdminLoggedIn, renderAdminHome);
adminRouter.route("/signup").get(renderAdminSignup).post(adminSignup);
adminRouter.route("/login").get(renderAdminLogin).post(adminLogin);
adminRouter
  .route("/add_pet")
  .get(isAdminLoggedIn, renderAddPet)
  .post(isAdminLoggedIn, upload.single("image"), addPet);
adminRouter.route("/requests").get(isAdminLoggedIn, renderRequests);
adminRouter.route("/:pet_id/accept").get(isAdminLoggedIn, acceptAdopt);
adminRouter.route("/history").get(isAdminLoggedIn, renderHistory);
adminRouter.route("/:pet_id/delete").get(isAdminLoggedIn, deletePet);
adminRouter.route("/:pet_id/:user_id/adopt").get(isAdminLoggedIn, adoptPet);
adminRouter
  .route("/:pet_id/:user_id/reject")
  .get(isAdminLoggedIn, rejectRequest);

adminRouter.route("/pets/:id").get(isAdminLoggedIn, renderShowPet);
