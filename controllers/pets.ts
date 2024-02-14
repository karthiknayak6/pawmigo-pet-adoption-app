import { Request, Response as ExpressResponse } from "express";
import { RowDataPacket } from "mysql2";
import { con } from "../model/db";

interface Response extends ExpressResponse {
  render: (view: string, locals?: Record<string, any>) => void;
}

export const renderHome = async (req: Request, res: Response) => {
  con.query("CALL GetAvailablePets()", (err, results: RowDataPacket[][]) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    console.log("Query result:", results);
    res.render("home", { pets: results[0] });
  });
};

export const renderSearchResults = (req: Request, res: Response) => {
  console.log(req.params);
  console.log(req.query);
  res.render("users/search_results");
};

export const renderShowPet = (req: Request, res: Response) => {
  res.render("pets/show_pet");
};
