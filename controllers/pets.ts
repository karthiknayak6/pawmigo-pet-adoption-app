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
  let pet_type = req.query.pet;
  let pet_location = req.query.location;

  console.log(pet_type, pet_location);

  // Construct the SQL query based on the provided parameters
  let sql = `
    SELECT Pet.*, PetImage.image_name, Shelter.*
    FROM Pet
    LEFT JOIN PetImage ON Pet.pet_id = PetImage.pet_id
    LEFT JOIN Shelter ON Pet.shelter_id = Shelter.shelter_id
    WHERE 1
  `;

  const values = [];

  if (pet_type === "pet") {
    // If pet value is "pet", don't filter by pet type
  } else if (pet_type) {
    sql += ` AND EXISTS (
      SELECT 1 FROM Breed WHERE Pet.pet_id = Breed.pet_id AND type = ?
    )`;
    values.push(pet_type);
  }

  if (pet_location) {
    sql += ` AND (LOWER(Shelter.city) = LOWER(?) OR LOWER(Shelter.state) = LOWER(?) OR LOWER(Shelter.country) = LOWER(?) OR LOWER(Shelter.street) = LOWER(?))`;
    values.push(pet_location, pet_location, pet_location, pet_location);
  }

  // Execute the SQL query
  con.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error fetching search results:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Group results by pet_id to handle multiple images for the same pet
    const groupedResults = results.reduce((acc: any, curr: any) => {
      const petId = curr.pet_id;
      if (!acc[petId]) {
        acc[petId] = {
          ...curr,
          images: [],
        };
      }
      if (curr.image_name) {
        acc[petId].images.push(curr.image_name);
      }
      return acc;
    }, {});

    // Convert grouped results back to array
    const finalResults = Object.values(groupedResults);

    // Render the view and pass search results data
    console.log("final RESLUTS::::", finalResults);
    res.render("users/search_results", { searchResults: finalResults });
  });
};

export const renderShelter = (req: Request, res: Response) => {
  const shelterId = req.params.id; // Assuming you have a route parameter for shelter ID
  // Query the database to fetch shelter details based on shelterId
  const sql = `
    SELECT *
    FROM Shelter
    WHERE shelter_id = ?
  `;
  con.query(sql, [shelterId], (err, results) => {
    if (err) {
      console.error("Error fetching shelter details:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (results.length === 0) {
      // Shelter not found
      res.status(404).send("Shelter not found");
      return;
    }
    // Render the shelter details page and pass the shelter object to the template
    res.render("pets/show_shelter", { shelter: results[0] });
  });
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
