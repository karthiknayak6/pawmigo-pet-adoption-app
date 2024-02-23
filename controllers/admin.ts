import { Request, Response, NextFunction } from "express";
import { con } from "../model/db";
import { Pet } from "../types/petTypes";
import { FieldPacket, QueryError, RowDataPacket } from "mysql2";
import { FieldInfo } from "mysql";

import passport from "passport";
import { genPassword } from "../middlewares/auth";

export const renderAdminLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/login");
};

export const renderAdminSignup = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/signup");
};

export const renderAdminHome = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("CU: ", res.locals.currentUser);
  const shelterId = res.locals.currentUser.shelter_id;

  const query = `
    SELECT 
        Pet.pet_id, 
        Pet.pet_name, 
        Pet.age, 
        Pet.description AS pet_description, 
        Pet.special_care_required, 
        PetImage.image_name, 
        Breed.type AS pet_type, 
        Breed.breed AS pet_breed, 
        Breed.description AS breed_description, 
        Breed.size, 
        Breed.avg_life_span 
    FROM 
        Pet 
    JOIN 
        Breed ON Pet.pet_id = Breed.pet_id 
    LEFT JOIN 
        PetImage ON Pet.pet_id = PetImage.pet_id 
    WHERE 
        Pet.shelter_id = ?
  `;

  con.query(query, [shelterId], (err, results) => {
    if (err) {
      console.error("Error fetching pet details:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    console.log("HOME RESULTS: ", results);
    res.render("admin/home", { pets: results });
  });
};

export const deletePet = (req: Request, res: Response) => {
  const deletePetId = req.params.pet_id;
  const shelterId = res.locals.currentUser.shelter_id;

  const sql = "DELETE FROM Pet WHERE pet_id = ? AND shelter_id = ?";
  const values = [deletePetId, shelterId];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error deleting pet:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (result.affectedRows === 0) {
      // No pet with the specified pet_id and shelter_id found
      res.status(404).send("Pet not found");
      return;
    }

    res.status(200).send("Pet deleted successfully");
  });
};

export const renderAddPet = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/add_pet");
};
export const adminSignup = async (req: Request, res: Response) => {
  console.log("Inside post");

  const {
    shelter_name,
    username,
    email,
    password,
    street,
    city,
    state,
    postal_code,
    country,
    phone,
  } = req.body;
  console.log(password);
  const saltHash = genPassword(password);
  console.log(saltHash);
  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const insertQuery = `
  INSERT INTO Shelter (
    shelter_name,
    username,
    email,
    password_hash,
    salt,
    street,
    city,
    state,
    postal_code,
    country,
    phone
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

  const values = [
    shelter_name,
    username,
    email,
    hash,
    salt,
    street,
    city,
    state,
    postal_code,
    country,
    phone,
  ];

  con.query(
    insertQuery,
    values,
    (
      error: Error | null,
      results: RowDataPacket[],
      fields: FieldPacket[] | FieldInfo[] | undefined
    ) => {
      if (error) {
        console.error("Error inserting shelter:", error);
        res.status(500).send("Error inserting shelter");
        return;
      }

      console.log("Shelter inserted successfully:", results);
      res.status(200).send("Shelter inserted successfully");
    }
  );
};
export const adminLogin = passport.authenticate("shelter", {
  failureRedirect: "/login-failure",
  successRedirect: "/admin",
});

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout({}, (err) => {
    if (err) {
      // Handle error
      console.error(err);
      next(err);
    } else {
      res.redirect("/admin");
    }
  });
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
    let shelter_id: number;

    if (
      req.user &&
      "shelter_id" in req.user &&
      typeof req.user.shelter_id === "number"
    ) {
      shelter_id = req.user.shelter_id;
    } else {
      res.send("No shelter is present");
      return;
    }

    con.query(
      "CALL AddNewPet(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @pet_id)",
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

        con.query("SELECT @pet_id as pet_id", function (error, rows) {
          if (error) {
            console.error("Error retrieving pet_id:", error);
            res.status(500).send("Error adding new pet");
            return;
          }

          const petId = rows[0].pet_id;

          console.log("PET_ID", petId);

          if (!petId) {
            console.error("Error: Unable to retrieve pet_id");
            res.status(500).send("Error adding new pet");
            return;
          }

          console.log("New pet added successfully with pet_id:", petId);
          const imagePath = req.file?.path;
          con.query(
            "INSERT INTO PetImage (pet_id, image_name) VALUES (?, ?)",
            [petId, imagePath?.replace(/^public/, "")],
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
