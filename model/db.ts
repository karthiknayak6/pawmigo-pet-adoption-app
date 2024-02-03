import mysql from "mysql";

export const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "pawmigo",
});

process.on("SIGINT", () => {
  con.end();
  process.exit();
});
