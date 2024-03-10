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
              res.status(500);
              req.flash("error", "Internal server error");
              res.redirect("/");
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
  let breed = req.query.breed; // Add breed parameter

  console.log(pet_type, pet_location, breed);

  // Construct the SQL query based on the provided parameters
  let sql = `
    SELECT Pet.*, PetImage.image_name, Shelter.*, Breed.*
    FROM Pet
    LEFT JOIN PetImage ON Pet.pet_id = PetImage.pet_id
    LEFT JOIN Shelter ON Pet.shelter_id = Shelter.shelter_id
    LEFT JOIN Breed ON Pet.pet_id = Breed.pet_id
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

  if (breed) {
    // Add condition for breed
    sql += ` AND EXISTS (
      SELECT 1 FROM Breed WHERE Pet.pet_id = Breed.pet_id AND breed = ?
    )`;
    values.push(breed);
  }

  if (pet_location) {
    sql += ` AND (LOWER(Shelter.city) = LOWER(?) OR LOWER(Shelter.state) = LOWER(?) OR LOWER(Shelter.country) = LOWER(?) OR LOWER(Shelter.street) = LOWER(?))`;
    values.push(pet_location, pet_location, pet_location, pet_location);
  }

  // Execute the SQL query
  con.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error fetching search results:", err);
      res.status(500);
      req.flash("error", "Internal server error");
      res.redirect("/");
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
    console.log("final RESULTS::::", finalResults);
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
      res.status(500);
      req.flash("error", "Internal server error");
      res.redirect("/pets");
      return;
    }
    if (results.length === 0) {
      res.status(404);
      req.flash("error", "Shelter not found!!");
      res.redirect("/");
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
        res.status(500);
        req.flash("error", "Internal server error");
        res.redirect("/");
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
        res.status(500);
        req.flash("error", "Internal server error!!");
        res.redirect("/");
        return;
      }

      console.log("Query result:", results);
      res.render("pets/adopt", { pet: results[0] });
    }
  );
};

export const adoptPet = (req: Request, res: Response) => {
  const { residence_type, pet_for, reason_for_adoption, care_plan } = req.body;
  const pet_id = req.params.id;
  const user_id = req.user.user_id;

  // Check if the user has already adopted the pet
  con.query(
    `SELECT * FROM AdoptionRequest WHERE pet_id = ? AND user_id = ?`,
    [pet_id, user_id],
    (existingRequestErr, existingRequestResult) => {
      if (existingRequestErr) {
        console.error(
          "Error while checking existing request:",
          existingRequestErr
        );
        res.status(500);
        req.flash(
          "error",
          "Error checking existing request. Please try again."
        );
        return res.redirect(`/pets/${pet_id}`);
      }

      console.log("exis", existingRequestResult);
      if (existingRequestResult.length > 0) {
        // User has already adopted the pet
        res.status(400); // or any other appropriate status code
        req.flash("error", "You have already sent a request for this pet.");
        return res.redirect(`/pets/${pet_id}`);
      }

      // If the user hasn't adopted the pet, insert the new adoption request
      con.query(
        `INSERT INTO AdoptionRequest (pet_id, user_id, residence_type, pet_for, reason_for_adoption, care_plan)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          pet_id,
          user_id,
          residence_type,
          pet_for,
          reason_for_adoption,
          care_plan,
        ],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error(
              "Error while submitting adoption request:",
              insertErr
            );
            res.status(500);
            req.flash("error", "Error sending the request. Please try again.");
            return res.redirect(`/pets/${pet_id}`);
          }

          res.status(200);
          req.flash("success", "Successfully sent the request!");
          res.redirect(`/pets/${pet_id}`);
        }
      );
    }
  );
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
    res.status(500);
    req.flash("error", "Internal server error");
  }
};
