import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import methodOverride from "method-override";
import morgan from "morgan";
import path from "path";
import ejsMate from "ejs-mate";
import { con } from "./model/db";
import { RowDataPacket } from "mysql2";
import { authRouter } from "./routes/auth";
import { petRouter } from "./routes/pets";

import passport, { DoneCallback } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bodyParser from "body-parser";
import crypto from "crypto";
import MySQLStoreFactory from "express-mysql-session";
import mysql from "mysql";

const session = require("express-session");
import flash from "express-flash";

const MySQLStore = MySQLStoreFactory(session);

import { User } from "./types/userTypes";
import { adminRouter } from "./routes/admin";

const PORT = 8080;

const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

//Livereload code
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "public"));
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

const app = express();
app.use(connectLiveReload());

app.use(methodOverride("_method"));
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(flash());

app.use(
  session({
    key: "auth",
    secret: "fu",
    sore: new MySQLStore({
      host: "localhost",
      port: 3306,
      user: "root",
      database: "cookie_user",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

con.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

const customFields = {
  usernameField: "username",
  passwordField: "password",
};

const verifyCallback = (
  username: string,
  password: string,
  done: (error: any, user?: User | false) => void
) => {
  con.query(
    "SELECT * FROM User WHERE username = ? ",
    [username],
    function (
      error: mysql.MysqlError | null,
      results: any,
      fields?: mysql.FieldInfo[]
    ) {
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
passport.use(strategy);

passport.serializeUser((user: any, done) => {
  console.log("inside serialize");
  done(null, user.user_id);
});

passport.deserializeUser(function (userId, done) {
  console.log("deserializeUser" + userId);
  con.query(
    "SELECT * FROM User where user_id = ?",
    [userId],
    function (error, results) {
      done(null, results[0]);
    }
  );
});

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

export function isAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/notAuthorized");
  }
}

// export function isAdmin(req: Request, res: Response, next: NextFunction) {
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect("/notAuthorizedAdmin");
//   }
// }

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

app.use((req, res, next) => {
  console.log(req.session);
  console.log("REQ DOT USER --> ", req.user);
  next();
});

const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    (req.session as any).returnTo = req.originalUrl;

    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }

  next();
};

app.use("/", authRouter);
app.use("/", petRouter);
app.use("/admin", adminRouter);

app.get("/protected-route", isAuth, (req, res, next) => {
  res.send(
    '<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>'
  );
});

app.get("/login-success", (req, res, next) => {
  res.send(
    '<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>'
  );
});

app.get("/login-failure", (req, res, next) => {
  res.send("You entered the wrong password.");
});

app.get("/notAuthorized", (req, res, next) => {
  console.log("Inside get");
  res.send(
    '<h1>You are not authorized to view the resource </h1><p><a href="/login">Retry Login</a></p>'
  );
});
app.get("/notAuthorizedAdmin", (req, res, next) => {
  console.log("Inside get");
  res.send(
    '<h1>You are not authorized to view the resource as you are not the admin of the page  </h1><p><a href="/login">Retry to Login as admin</a></p>'
  );
});
app.get("/userAlreadyExists", (req, res, next) => {
  console.log("Inside get");
  res.send(
    '<h1>Sorry This username is taken </h1><p><a href="/register">Register with different username</a></p>'
  );
});

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
