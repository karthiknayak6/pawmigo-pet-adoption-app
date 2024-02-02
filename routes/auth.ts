import express from "express";
import { renderLogin, renderSignup } from "../controllers/auth";
export const router = express.Router();
router.route("/signup").get(renderSignup);
router.route("/login").get(renderLogin);
