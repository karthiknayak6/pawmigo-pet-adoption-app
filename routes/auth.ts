import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  login,
  logout,
  renderLogin,
  renderSignup,
  signup,
} from "../controllers/auth";
export const authRouter = express.Router();
authRouter.route("/signup").get(renderSignup).post(signup);
authRouter.route("/login").get(renderLogin).post(login);
authRouter.route("/logout").get(logout);
