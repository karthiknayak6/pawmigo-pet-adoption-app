import mysql from "mysql2";

export const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "petAdoption",
});

process.on("SIGINT", () => {
  con.end();
  process.exit();
});
