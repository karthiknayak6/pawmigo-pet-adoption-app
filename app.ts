import express from "express";
import mongoose from "mongoose";
import methodOverride from "method-override";
import morgan from "morgan";
import path from "path";
import ejsMate from "ejs-mate";
import { con } from "./model/db";
import { RowDataPacket } from "mysql2";
import { router } from "./routes/auth";

const PORT = 8080;
const app = express();

app.use(methodOverride("_method"));
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

con.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.use("/", router);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
