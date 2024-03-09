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

    res.status(200);
    req.flash("success", "Pet deleted successfully");
    res.redirect("/admin");
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
        res.status(500);
        req.flash("error", "Error adding shelter");
        res.redirect("/admin/signup");
        return;
      }

      console.log("Shelter inserted successfully:", results);
      res.status(200);
      req.flash("error", "Shelter registered successfully!");
      res.redirect("/admin/");
    }
  );
};
export const adminLogin = passport.authenticate("shelter", {
  failureRedirect: "/admin/login",
  successRedirect: "/admin",
  failureFlash: true,
});

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout({}, (err) => {
    if (err) {
      // Handle error
      console.error(err);
      next(err);
    } else {
      res.status(200);
      req.flash("success", "Successfully Logged out!!");
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
      gender,
    }: Pet = req.body;
    let shelter_id = req.user.shelter_id;
    con.query(
      "CALL AddNewPet(?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, @pet_id)",
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
        gender,
      ],
      function (
        error: QueryError | null,
        results?: RowDataPacket[],
        fields?: FieldInfo[]
      ) {
        if (error) {
          console.error("Error adding new pet:", error);
          res.status(500);
          req.flash("error", "Error adding new pet");
          res.redirect("/admin/add_pet");
          return;
        }

        con.query("SELECT @pet_id as pet_id", function (error, rows) {
          if (error) {
            console.error("Error retrieving pet_id:", error);
            res.status(500);
            req.flash("error", "Error adding new pet");
            res.redirect("/admin/add_pet");
            return;
          }

          const petId = rows[0].pet_id;

          console.log("PET_ID", petId);

          if (!petId) {
            console.error("Error: Unable to retrieve pet_id");
            res.status(500);
            req.flash("error", "Error adding new pet");
            res.redirect("/admin/add_pet");
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
                res.status(500);
                req.flash("error", "Error adding new pet");
                res.redirect("/admin/add_pet");
                return;
              }
              console.log("Pet image added successfully");
              req.flash("success", "Pet added successfully");
              res.redirect("/admin/add_pet");
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
  const user_id = req.params.user_id;

  // Check if any request for this pet has already been approved
  const checkApprovalSQL = `
      SELECT status
      FROM AdoptionRequest 
      WHERE pet_id = ? AND status = 'accepted'
  `;
  con.query(checkApprovalSQL, [pet_id], async (err, rows) => {
    if (err) {
      console.error("Error checking approval status:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (rows.length > 0) {
      res
        .status(400)
        .send("Another request for this pet has already been approved");
      return;
    }

    const sql = `
    UPDATE AdoptionRequest 
    SET status = 'accepted' 
    WHERE pet_id = ? AND user_id = ? AND EXISTS (
        SELECT 1
        FROM Pet
        WHERE Pet.pet_id = ? AND Pet.shelter_id = ? AND AdoptionRequest.pet_id = Pet.pet_id AND AdoptionRequest.user_id = ?
    )
`;
    const values = [pet_id, user_id, pet_id, shelter_id, user_id];
    con.query(sql, values, async (err, result) => {
      if (err) {
        console.error("Error accepting adoption request:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (result.affectedRows === 0) {
        // No adoption request found for the specified pet_id and shelter_id
        res.status(404);
        req.flash("error", "Adoption request not found");
        res.redirect("/admin/requests");
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
        res.status(200);
        req.flash(
          "success",
          "Adoption request status updated and email sent successfully"
        );

        res.redirect("/admin/requests");
      });
    });
  });
};

export const adoptPet = (req: Request, res: Response) => {
  const pet_id = req.params.pet_id;
  const user_id = req.params.user_id;

  // Check if the adoption request for this pet has been approved
  const checkApprovalSQL = `
      SELECT status
      FROM AdoptionRequest 
      WHERE pet_id = ? AND user_id = ? AND status = 'accepted'
  `;
  con.query(checkApprovalSQL, [pet_id, user_id], async (err, rows) => {
    if (err) {
      console.error("Error checking approval status:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (rows.length === 0) {
      // Adoption request has not been approved yet
      res.status(400).send("Adoption request has not been approved yet");
      return;
    }

    // Update the status of the adoption request to 'adopted'
    const adoptionUpdateSQL = `
          UPDATE AdoptionRequest 
          SET status = 'adopted' 
          WHERE pet_id = ? AND user_id = ?
      `;
    const adoptionValues = [pet_id, user_id];

    con.query(adoptionUpdateSQL, adoptionValues, (err, result) => {
      if (err) {
        console.error("Error updating adoption request:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (result.affectedRows === 0) {
        // No adoption request found for the specified pet_id and user_id
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

        res.status(200);
        req.flash("success", "Pet adopted successfully");
        res.redirect("/admin/requests");
      });
    });
  });
};

export const rejectRequest = (req: Request, res: Response) => {
  const pet_id = req.params.pet_id;
  const user_id = req.params.user_id;

  // Fetch user's email
  const fetchUserEmailSQL = `
    SELECT email
    FROM User
    WHERE user_id = ?
  `;
  con.query(fetchUserEmailSQL, [user_id], (err, rows) => {
    if (err) {
      console.error("Error fetching user email:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (rows.length === 0) {
      // User not found
      res.status(404).send("User not found");
      return;
    }

    const userEmail = rows[0].email;

    // Update the status of the adoption request to 'rejected'
    const rejectionUpdateSQL = `
      UPDATE AdoptionRequest 
      SET status = 'rejected' 
      WHERE pet_id = ? AND user_id = ?
    `;
    const rejectionValues = [pet_id, user_id];

    con.query(rejectionUpdateSQL, rejectionValues, async (err, result) => {
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

      // Insert the rejected request into the AdoptionHistory table
      const adoptionHistorySQL = `
        INSERT INTO AdoptionHistory (pet_id, user_id, adoption_date)
        VALUES (?, ?, NOW())
      `;
      const adoptionHistoryValues = [pet_id, user_id];

      con.query(
        adoptionHistorySQL,
        adoptionHistoryValues,
        async (err, result) => {
          if (err) {
            console.error(
              "Error adding rejected request to adoption history:",
              err
            );
            res.status(500).send("Internal Server Error");
            return;
          }

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
            subject: "Your pet adoption request has been rejected", // Subject line
            html: `<p>Dear Pet Adopter,</p>
              <p>We regret to inform you that your pet adoption request has been rejected.</p>
              <p>If you have any questions or need further assistance, please feel free to contact us.</p>
              <p>Best Regards,</p>
              <p>The Pawmigo Team</p>
            `, // html body
          };

          // Send email
          try {
            await transporter.sendMail(mailOptions);
            console.log("Rejection email sent successfully");
          } catch (error) {
            console.error("Error sending rejection email:", error);
          }

          // Adoption request rejected, rejection email sent, and added to adoption history successfully
          res.status(200);
          req.flash("success", "Adoption request rejected successfully");
          res.redirect("/admin/requests");
        }
      );
    });
  });
};

export const renderHistory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const shelter_id = req.user.shelter_id;

  // Fetch adoption history and status from the database for the specific shelter
  const sql = `
    SELECT Pet.pet_name, Pet.pet_id, User.user_id,  User.username, AdoptionHistory.adoption_date, AdoptionRequest.status
    FROM AdoptionHistory
    INNER JOIN Pet ON AdoptionHistory.pet_id = Pet.pet_id
    INNER JOIN User ON AdoptionHistory.user_id = User.user_id
    LEFT JOIN AdoptionRequest ON Pet.pet_id = AdoptionRequest.pet_id AND AdoptionHistory.user_id = AdoptionRequest.user_id
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
export const viewRequest = (req: Request, res: Response) => {
  const pet_id = req.params.pet_id;
  const user_id = req.params.user_id;

  // Query to fetch adoption request along with pet details, pet image, and user details
  const sql = `
    SELECT ar.*, p.*, pi.image_name, u.*
    FROM AdoptionRequest ar
    JOIN Pet p ON ar.pet_id = p.pet_id
    JOIN PetImage pi ON p.pet_id = pi.pet_id
    JOIN User u ON ar.user_id = u.user_id
    WHERE ar.pet_id = ? AND ar.user_id = ?
  `;
  const values = [pet_id, user_id];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error fetching adoption request:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (result.length === 0) {
      // No matching adoption request found
      res.status(404).send("Adoption request not found");
      return;
    }

    // Render the view with adoption request, pet details, pet image, and user details
    res.render("admin/view_request", { adoptionRequest: result[0] });
  });
};
