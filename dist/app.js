"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const method_override_1 = __importDefault(require("method-override"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const ejs_mate_1 = __importDefault(require("ejs-mate"));
const db_1 = require("./model/db");
const PORT = 8080;
const app = (0, express_1.default)();
app.use((0, method_override_1.default)("_method"));
app.use((0, morgan_1.default)("tiny"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.engine("ejs", ejs_mate_1.default);
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
db_1.con.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL database");
});
app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
