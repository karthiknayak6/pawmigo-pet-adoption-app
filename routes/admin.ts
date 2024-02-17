import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  addPet,
  renderAddPet,
  renderAdminHome,
  renderHistory,
  renderRequests,
} from "../controllers/admin";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "pet_images");
  },

  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
export const adminRouter = express.Router();
adminRouter.route("/").get(renderAdminHome);
adminRouter
  .route("/add_pet")
  .get(renderAddPet)
  .post(upload.single("image"), addPet);
adminRouter.route("/requests").get(renderRequests);
adminRouter.route("/history").get(renderHistory);
