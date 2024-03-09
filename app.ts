import express from "express";
import methodOverride from "method-override";
import morgan from "morgan";
import path from "path";
import ejsMate from "ejs-mate";
import { con } from "./model/db";
import { authRouter } from "./routes/auth";
import { petRouter } from "./routes/pets";
import passport from "passport";
import bodyParser from "body-parser";
import MySQLStoreFactory from "express-mysql-session";

const session = require("express-session");
import flash from "express-flash";

const MySQLStore = MySQLStoreFactory(session);

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

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", authRouter);
app.use("/", petRouter);
app.use("/admin", adminRouter);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
