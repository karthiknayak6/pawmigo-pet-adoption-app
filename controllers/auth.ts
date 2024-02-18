import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import { con } from "../model/db";

import passport from "passport";
import { genPassword } from "../middlewares/auth";

export const renderSignup = async (req: Request, res: Response) => {
  res.render("users/signup");
};

export const renderLogin = async (req: Request, res: Response) => {
  res.render("users/login");
};

export const signup = async (req: Request, res: Response) => {
  console.log("Inside post");
  console.log(req.body.password);
  const saltHash = genPassword(req.body.password);
  console.log(saltHash);
  const salt = saltHash.salt;
  const hash = saltHash.hash;
  const { first_name, last_name, email, username } = req.body;
  con.query(
    "INSERT INTO User(first_name, last_name, username,email, password_hash, salt) values(?,?,?,?,?,?) ",
    [first_name, last_name, username, email, hash, salt],
    function (error, results, fields) {
      if (error) {
        console.log("SIGNUP ERROR: ", error);
      } else {
        console.log("Successfully Entered");
      }
    }
  );

  res.redirect("/login");
};

export const login = passport.authenticate("user", {
  failureRedirect: "/login-failure",
  successRedirect: "/",
});

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout({}, (err) => {
    if (err) {
      // Handle error
      console.error(err);
      next(err);
    } else {
      res.redirect("/");
    }
  });
};
