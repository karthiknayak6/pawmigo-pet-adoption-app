import { Request, Response, NextFunction } from "express";
import { con } from "../model/db";
import { Pet } from "../types/petTypes";
import { FieldPacket, QueryError, RowDataPacket } from "mysql2";
import { FieldInfo } from "mysql";
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

require("dotenv").config();

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
        Pet.is_available, 
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
    let shelter_id = req.user.shelter_id;
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
  let shelter_id = req.user.shelter_id;

  const sql = `
      SELECT 
        AdoptionRequest.*, 
        User.username,User.first_name, User.last_name, User.email,
        Pet.pet_name, Pet.age, Pet.description
      FROM 
        AdoptionRequest
      INNER JOIN 
        User ON AdoptionRequest.user_id = User.user_id
      INNER JOIN 
        Pet ON AdoptionRequest.pet_id = Pet.pet_id
      WHERE 
        Pet.shelter_id = ?
    `;
  const values = [shelter_id];

  con.query(sql, values, (err, adoptionRequests) => {
    if (err) {
      console.error("Error fetching adoption requests:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    console.log(adoptionRequests);
    // Render the view with the fetched data
    res.render("admin/requests", { requests: adoptionRequests });
  });
};

export const acceptAdopt = (req: Request, res: Response) => {
  const pet_id = req.params.pet_id;
  const shelter_id = req.user.shelter_id;

  // Update the status of the adoption request to 'accepted'
  const sql = `
      UPDATE AdoptionRequest 
      SET status = 'accepted' 
      WHERE pet_id = ? AND user_id IN (
        SELECT user_id FROM Pet WHERE pet_id = ? AND shelter_id = ?
      )
    `;
  const values = [pet_id, pet_id, shelter_id];

  con.query(sql, values, async (err, result) => {
    if (err) {
      console.error("Error accepting adoption request:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (result.affectedRows === 0) {
      // No adoption request found for the specified pet_id and shelter_id
      res.status(404).send("Adoption request not found");
      return;
    }

    // Fetch user's email
    const userEmailSQL = `
      SELECT User.email
      FROM User
      INNER JOIN AdoptionRequest ON User.user_id = AdoptionRequest.user_id
      WHERE AdoptionRequest.pet_id = ? AND AdoptionRequest.status = 'accepted'
    `;
    con.query(userEmailSQL, [pet_id], async (err, rows) => {
      if (err) {
        console.error("Error fetching user email:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (rows.length === 0) {
        // No user found for the specified pet_id and adoption status
        res.status(404).send("User not found");
        return;
      }

      const userEmail = rows[0].email;

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.NM_USER,
          pass: process.env.NM_PASSWORD,
        },
      });

      // Configure email options
      const mailOptions = {
        from: {
          name: "Pawmigo",
          address: process.env.NM_USER,
        },
        to: userEmail,
        subject:
          "Congratulations!!, your pet adoption request has been approved!", // Subject line
        html: `<p>Dear Pet Adopter,</p>
        <p>Congratulations! We're thrilled to inform you that your pet adoption request has been approved.</p>
        <p>The next step in the process is to visit our shelter to complete the adoption and bring your new furry friend home. Our shelter staff will be delighted to assist you in finalizing the adoption process and providing you with all the necessary information about your new pet.</p>
        <p>Please feel free to contact us if you have any questions or need further assistance. We look forward to seeing you soon!</p>
        <p>Best Regards,</p>
        <p>The Pawmigo Team</p>
      `, // html body
      };

      // Send email
      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
      } catch (error) {
        console.error("Error sending email:", error);
      }

      // Adoption request status updated and email sent successfully
      res.status(200).send("Adoption request accepted successfully");
    });
  });
};

export const adoptPet = (req: Request, res: Response) => {
  const pet_id = req.params.pet_id;
  const shelter_id = req.user.shelter_id;
  const user_id = req.params.user_id;

  // Update the status of the adoption request to 'adopted'
  const adoptionUpdateSQL = `
      UPDATE AdoptionRequest 
      SET status = 'adopted' 
      WHERE pet_id = ? AND user_id IN (
        SELECT user_id FROM Pet WHERE pet_id = ? AND shelter_id = ?
      )
    `;
  const adoptionValues = [pet_id, pet_id, shelter_id];

  con.query(adoptionUpdateSQL, adoptionValues, (err, result) => {
    if (err) {
      console.error("Error updating adoption request:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (result.affectedRows === 0) {
      // No adoption request found for the specified pet_id and shelter_id
      res.status(404).send("Adoption request not found");
      return;
    }

    // Insert a record into AdoptionHistory table
    const adoptionHistorySQL = `
        INSERT INTO AdoptionHistory (pet_id, user_id, adoption_date)
        VALUES (?, ?, NOW())
      `;
    const adoptionHistoryValues = [pet_id, user_id];

    con.query(adoptionHistorySQL, adoptionHistoryValues, (err, result) => {
      if (err) {
        console.error("Error adding adoption to history:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      // Delete the adoption request tuple
      const requestDeleteSQL = `
          DELETE FROM AdoptionRequest 
          WHERE pet_id = ? AND user_id = ?
      `;
      const requestDeleteValues = [pet_id, user_id];

      con.query(requestDeleteSQL, requestDeleteValues, (err, result) => {
        if (err) {
          console.error("Error deleting adoption request:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        // Adoption recorded and request deleted successfully
        res.status(200).send("Pet adopted successfully");
      });
    });
  });
};

export const rejectRequest = (req: Request, res: Response) => {
  const pet_id = req.params.pet_id;
  const user_id = req.params.user_id;

  // Update the status of the adoption request to 'rejected'
  const rejectionUpdateSQL = `
    UPDATE AdoptionRequest 
    SET status = 'rejected' 
    WHERE pet_id = ? AND user_id = ?
  `;
  const rejectionValues = [pet_id, user_id];

  con.query(rejectionUpdateSQL, rejectionValues, (err, result) => {
    if (err) {
      console.error("Error rejecting adoption request:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (result.affectedRows === 0) {
      // No adoption request found for the specified pet_id and user_id
      res.status(404).send("Adoption request not found");
      return;
    }

    // Adoption request rejected successfully
    res.status(200).send("Adoption request rejected successfully");
  });
};

export const renderHistory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const shelter_id = req.user.shelter_id;

  // Fetch adoption history from the database for the specific shelter
  const sql = `
    SELECT Pet.pet_name, User.username, AdoptionHistory.adoption_date
    FROM AdoptionHistory
    INNER JOIN Pet ON AdoptionHistory.pet_id = Pet.pet_id
    INNER JOIN User ON AdoptionHistory.user_id = User.user_id
    WHERE Pet.shelter_id = ?
    ORDER BY AdoptionHistory.adoption_date DESC
  `;

  con.query(sql, [shelter_id], (err, rows) => {
    if (err) {
      console.error("Error fetching adoption history:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Render the view and pass adoption history data
    res.render("admin/history", { adoptionHistory: rows });
  });
};
