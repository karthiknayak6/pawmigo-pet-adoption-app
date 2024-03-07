import express from "express";
import {
  adoptPet,
  renderAdoptPet,
  renderHome,
  renderSearchResults,
  renderShelter,
  renderShowPet,
} from "../controllers/pets";
import { isLoggedIn } from "../middlewares/auth";
export const petRouter = express.Router();
petRouter.route("/").get(isLoggedIn, renderHome);
petRouter.route("/search").get(renderSearchResults);
petRouter.route("/").get(renderHome);
petRouter.route("/pets/:id").get(isLoggedIn, renderShowPet);
petRouter
  .route("/pets/:id/adopt")
  .get(isLoggedIn, renderAdoptPet)
  .post(isLoggedIn, adoptPet);
petRouter.route("/shelters/:id").get(renderShelter);
