import { Request, Response, NextFunction } from "express";
import { con } from "../model/db";
import { Pet } from "../types/petTypes";
import { QueryError, RowDataPacket } from "mysql2";
import { FieldInfo } from "mysql";

export const renderAdminHome = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/home");
};

export const renderAddPet = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/add_pet");
};

export const addPet = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      pet_name,
      type,
      breed,
      age,
      description,
      special_care_required,
      size,
      avg_life_span,
      breed_desc,
    }: Pet = req.body;

    const shelter_id = 1; // Assuming shelter_id is always 1 for now

    // Assuming con is your MySQL connection
    con.query(
      "CALL AddNewPet(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @pet_id)", // Using @pet_id to capture the returned pet_id
      [
        pet_name,
        age,
        special_care_required,
        shelter_id,
        type,
        breed,
        description,
        breed_desc,
        size,
        avg_life_span,
      ],
      function (
        error: QueryError | null,
        results?: RowDataPacket[],
        fields?: FieldInfo[]
      ) {
        if (error) {
          console.error("Error adding new pet:", error);
          res.status(500).send("Error adding new pet");
          return;
        }

        // Retrieve the pet_id from the stored procedure output parameter
        con.query("SELECT @pet_id as pet_id", function (error, rows) {
          if (error) {
            console.error("Error retrieving pet_id:", error);
            res.status(500).send("Error adding new pet");
            return;
          }

          const petId = rows[0].pet_id;

          console.log("PET_ID", petId); // Get the pet_id from the result

          if (!petId) {
            console.error("Error: Unable to retrieve pet_id");
            res.status(500).send("Error adding new pet");
            return;
          }

          console.log("New pet added successfully with pet_id:", petId);
          const imagePath = req.file?.path; // Assuming multer stores the path to the file in req.file.path
          con.query(
            "INSERT INTO PetImage (pet_id, image_name) VALUES (?, ?)",
            [petId, imagePath],
            function (error) {
              if (error) {
                console.error("Error adding pet image:", error);
                res.status(500).send("Error adding new pet");
                return;
              }
              console.log("Pet image added successfully");
              res.send("Success");
            }
          );
        });
      }
    );
  } catch (err) {
    console.error("Error in addPet function:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const renderRequests = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/requests");
};
export const renderHistory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/history");
};
