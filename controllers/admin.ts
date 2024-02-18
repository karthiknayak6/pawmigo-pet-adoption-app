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
  res.render("admin/home");
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
      res.redirect("/protected-route");
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

    const shelter_id = 1;

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
