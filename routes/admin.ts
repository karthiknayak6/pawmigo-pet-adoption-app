import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  addPet,
  adminLogin,
  adminSignup,
  renderAddPet,
  renderAdminHome,
  renderAdminLogin,
  renderAdminSignup,
  renderHistory,
  renderRequests,
} from "../controllers/admin";

import multer from "multer";
import path from "path";
import { isAdminLoggedIn, isLoggedIn } from "../middlewares/auth";

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
  .get(renderAddPet)
  .post(upload.single("image"), addPet);
adminRouter.route("/requests").get(renderRequests);
adminRouter.route("/history").get(renderHistory);
