import express from "express";
import {
  renderHome,
  renderSearchResults,
  renderShowPet,
} from "../controllers/pets";
export const petRouter = express.Router();
petRouter.route("/").get(renderHome);
petRouter.route("/search/:type").get(renderSearchResults);
petRouter.route("/").get(renderHome);
petRouter.route("/pets/:id").get(renderShowPet);
