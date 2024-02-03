import express from "express";
import { renderHome } from "../controllers/pets";
export const petRouter = express.Router();
petRouter.route("/").get(renderHome);
