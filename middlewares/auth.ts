import { Request, Response, NextFunction } from "express";
import { con } from "../model/db";
import { User } from "../types/userTypes";
import { FieldInfo, MysqlError } from "mysql";

import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import crypto from "crypto";
import { Shelter } from "../types/shelterTypes";

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.user_id) {
    next();
  } else {
    res.redirect("/login");
  }
};

export const isAdminLoggedIn = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    req.isAuthenticated() &&
    "shelter_id" in req.user &&
    req.user.shelter_id
  ) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

//Passport

const customFields = {
  usernameField: "username",
  passwordField: "password",
};
const verifyCallback = (
  username: string,
  password: string,
  done: (error: any, user?: any | false) => void
) => {
  con.query(
    "SELECT * FROM User WHERE username = ? ",
    [username],
    function (error: MysqlError | null, results: any, fields?: FieldInfo[]) {
      if (error) return done(error);

      const users = results as User[];
      if (users.length === 0) {
        return done(null, false);
      }

      const isValid = validPassword(
        password,
        users[0].password_hash,
        users[0].salt
      );

      const user: any = {
        user_id: users[0].user_id,
        username: users[0].username,
        password_hash: users[0].password_hash,
        salt: users[0].salt,
      };
      if (isValid) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    }
  );
};

const strategy = new LocalStrategy(customFields, verifyCallback);
passport.use("user", strategy);

export function validPassword(password: string, hash: string, salt: string) {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 60, "sha512")
    .toString("hex");
  return hash === hashVerify;
}
export function genPassword(password: string) {
  var salt = crypto.randomBytes(32).toString("hex");
  var genhash = crypto
    .pbkdf2Sync(password, salt, 10000, 60, "sha512")
    .toString("hex");
  return { salt: salt, hash: genhash };
}

export function userExists(req: Request, res: Response, next: NextFunction) {
  con.query(
    "Select * from users where username=? ",
    [req.body?.username],
    function (error, results, fields) {
      if (error) {
        console.log("Error");
      } else if (results.length > 0) {
        res.redirect("/userAlreadyExists");
      } else {
        next();
      }
    }
  );
}
const shelterVerifyCallback = (
  username: string,
  password: string,
  done: (error: any, shelter?: Shelter | false) => void
) => {
  con.query(
    "SELECT * FROM Shelter WHERE username = ?",
    [username],
    function (error: MysqlError | null, results: any, fields?: FieldInfo[]) {
      if (error) return done(error);

      const shelters = results as Shelter[];
      if (shelters.length === 0) {
        return done(null, false);
      }

      const isValid = validPassword(
        password,
        shelters[0].password_hash,
        shelters[0].salt
      );

      const shelter: any = {
        shelter_id: shelters[0].shelter_id,
        username: shelters[0].username,
        password_hash: shelters[0].password_hash,
        salt: shelters[0].salt,
      };
      if (isValid) {
        return done(null, shelter);
      } else {
        return done(null, false);
      }
    }
  );
};

const shelterStrategy = new LocalStrategy(customFields, shelterVerifyCallback);
passport.use("shelter", shelterStrategy); // Use a different name for the strategy to differentiate between user and shelter authentication.

passport.serializeUser((user: any, done) => {
  if ("user_id" in user) {
    done(null, user.user_id); // Serialize User
  } else if ("shelter_id" in user) {
    done(null, `shelter:${user.shelter_id}`); // Serialize Shelter
  } else {
    done(new Error("Invalid user object")); // Handle error
  }
});

passport.deserializeUser(function (serializedId: any, done) {
  console.log("SER ID: ", serializedId);
  if (typeof serializedId === "number") {
    // Deserialize User ID
    con.query(
      "SELECT * FROM User where user_id = ?",
      [serializedId],
      function (error, results) {
        if (error) {
          return done(error);
        }
        done(null, results[0]);
      }
    );
  } else if (
    typeof serializedId === "string" &&
    serializedId.startsWith("shelter:")
  ) {
    // Deserialize Shelter ID
    const shelterId = parseInt(serializedId.substring("shelter:".length));
    con.query(
      "SELECT * FROM Shelter WHERE shelter_id = ?",
      [shelterId],
      function (error, results) {
        if (error) {
          return done(error);
        }
        done(null, results[0]);
      }
    );
  } else {
    done(new Error("Invalid serialized ID")); // Handle error
  }
});
