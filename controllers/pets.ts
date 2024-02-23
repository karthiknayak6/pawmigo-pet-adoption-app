import { Request, Response as ExpressResponse } from "express";
import { RowDataPacket } from "mysql2";
import { con } from "../model/db";

interface Response extends ExpressResponse {
  render: (view: string, locals?: Record<string, any>) => void;
}

export const renderHome = async (req: Request, res: Response) => {
  con.query(
    "SELECT * FROM AvailablePets",
    (err, results: RowDataPacket[][]) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      console.log("Query result:", results);
      if ("images" in results[0]) console.log("Images: ", results[0].images);
      res.render("home", { pets: results });
    }
  );
};

export const renderSearchResults = (req: Request, res: Response) => {
  console.log(req.params);
  console.log(req.query);
  res.render("users/search_results");
};

export const renderShowPet = (req: Request, res: Response) => {
  console.log(req.params.id);
  con.query(
    "SELECT * FROM AvailablePets WHERE pet_id = ?",
    [req.params.id],
    (err, results: RowDataPacket[][]) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      console.log("Query result:", results);
      res.render("pets/show_pet", { pet: results[0] });
    }
  );
};

export const renderAdoptPet = (req: Request, res: Response) => {
  console.log(req.params.id);
  con.query(
    "SELECT * FROM AvailablePets WHERE pet_id = ?",
    [req.params.id],
    (err, results: RowDataPacket[][]) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      console.log("Query result:", results);
      res.render("pets/adopt", { pet: results[0] });
    }
  );
};

export const adoptPet = async (req: Request, res: Response) => {
  const { residence_type, pet_for, reason_for_adoption, care_plan } = req.body;
  const pet_id = req.params.id;
  let user_id;

  if (req.user && "user_id" in req.user) user_id = req.user?.user_id;

  try {
    const result = await con.query(
      `INSERT INTO AdoptionRequest (pet_id, user_id, residence_type, pet_for, reason_for_adoption, care_plan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pet_id, user_id, residence_type, pet_for, reason_for_adoption, care_plan]
    );

    res.status(200).json({
      success: true,
      message: "Adoption request submitted successfully",
    });
  } catch (error) {
    console.error("Error while submitting adoption request:", error);
    res
      .status(500)
      .json({ success: false, message: "Error submitting adoption request" });
  }
};
