import express from "express";
import { renderHome } from "../controllers/pets";
const router = express.Router();
router.route("/").get(renderHome);
