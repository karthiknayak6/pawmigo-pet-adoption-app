import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { con } from "../model/db";
import { FieldInfo, MysqlError } from "mysql";
import { Connection } from "mongoose";

export const renderHome = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch available pets
    con.query(
      "SELECT * FROM AvailablePets",
      async (err: MysqlError, petResults: RowDataPacket[][]) => {
        if (err) {
          console.error("Error executing pets query:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        console.log("Pets query result:", petResults);

        // Fetch shelters
        con.query(
          "SELECT * FROM Shelter",
          async (err: MysqlError, shelterResults: RowDataPacket[][]) => {
            if (err) {
              console.error("Error executing shelters query:", err);
              res.status(500).send("Internal Server Error");
              return;
            }

            console.log("Shelters query result:", shelterResults);

            // Render home page with pets and shelters data
            res.render("home", { pets: petResults, shelters: shelterResults });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error in renderHome:", error);
    res.status(500).send("Internal Server Error");
  }
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
  let user_id = req.user.user_id;

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

export const fetchShelters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const shelters = await con.query("SELECT * FROM Shelter");
    res.status(200).json(shelters);
  } catch (error) {
    console.error("Error while fetching shelters:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
