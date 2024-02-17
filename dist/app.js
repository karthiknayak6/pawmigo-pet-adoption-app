"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userExists = exports.isAuth = exports.genPassword = exports.validPassword = void 0;
const express_1 = __importDefault(require("express"));
const method_override_1 = __importDefault(require("method-override"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const ejs_mate_1 = __importDefault(require("ejs-mate"));
const db_1 = require("./model/db");
const auth_1 = require("./routes/auth");
const pets_1 = require("./routes/pets");
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const body_parser_1 = __importDefault(require("body-parser"));
const crypto_1 = __importDefault(require("crypto"));
const express_mysql_session_1 = __importDefault(require("express-mysql-session"));
const session = require("express-session");
const MySQLStore = (0, express_mysql_session_1.default)(session);
const admin_1 = require("./routes/admin");
const PORT = 8080;
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");
//Livereload code
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path_1.default.join(__dirname, "public"));
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
});
const app = (0, express_1.default)();
app.use(connectLiveReload());
app.use((0, method_override_1.default)("_method"));
app.use((0, morgan_1.default)("tiny"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.engine("ejs", ejs_mate_1.default);
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
app.use(session({
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
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(body_parser_1.default.json());
db_1.con.connect((err) => {
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
const verifyCallback = (username, password, done) => {
    db_1.con.query("SELECT * FROM User WHERE username = ? ", [username], function (error, results, fields) {
        if (error)
            return done(error);
        const users = results;
        if (users.length === 0) {
            return done(null, false);
        }
        const isValid = validPassword(password, users[0].password_hash, users[0].salt);
        const user = {
            user_id: users[0].user_id,
            username: users[0].username,
            password_hash: users[0].password_hash,
            salt: users[0].salt,
        };
        if (isValid) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    });
};
const strategy = new passport_local_1.Strategy(customFields, verifyCallback);
passport_1.default.use(strategy);
passport_1.default.serializeUser((user, done) => {
    console.log("inside serialize");
    done(null, user.user_id);
});
passport_1.default.deserializeUser(function (userId, done) {
    console.log("deserializeUser" + userId);
    db_1.con.query("SELECT * FROM User where user_id = ?", [userId], function (error, results) {
        done(null, results[0]);
    });
});
function validPassword(password, hash, salt) {
    var hashVerify = crypto_1.default
        .pbkdf2Sync(password, salt, 10000, 60, "sha512")
        .toString("hex");
    return hash === hashVerify;
}
exports.validPassword = validPassword;
function genPassword(password) {
    var salt = crypto_1.default.randomBytes(32).toString("hex");
    var genhash = crypto_1.default
        .pbkdf2Sync(password, salt, 10000, 60, "sha512")
        .toString("hex");
    return { salt: salt, hash: genhash };
}
exports.genPassword = genPassword;
function isAuth(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect("/notAuthorized");
    }
}
exports.isAuth = isAuth;
// export function isAdmin(req: Request, res: Response, next: NextFunction) {
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect("/notAuthorizedAdmin");
//   }
// }
function userExists(req, res, next) {
    var _a;
    db_1.con.query("Select * from users where username=? ", [(_a = req.body) === null || _a === void 0 ? void 0 : _a.username], function (error, results, fields) {
        if (error) {
            console.log("Error");
        }
        else if (results.length > 0) {
            res.redirect("/userAlreadyExists");
        }
        else {
            next();
        }
    });
}
exports.userExists = userExists;
app.use((req, res, next) => {
    // console.log(req.session);
    // console.log(req.user);
    next();
});
app.use("/", auth_1.authRouter);
app.use("/", pets_1.petRouter);
app.use("/admin", admin_1.adminRouter);
app.get("/protected-route", isAuth, (req, res, next) => {
    res.send('<h1>You are authenticated</h1><p><a href="/logout">Logout and reload</a></p>');
});
app.get("/login-success", (req, res, next) => {
    res.send('<p>You successfully logged in. --> <a href="/protected-route">Go to protected route</a></p>');
});
app.get("/login-failure", (req, res, next) => {
    res.send("You entered the wrong password.");
});
app.get("/notAuthorized", (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>You are not authorized to view the resource </h1><p><a href="/login">Retry Login</a></p>');
});
app.get("/notAuthorizedAdmin", (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>You are not authorized to view the resource as you are not the admin of the page  </h1><p><a href="/login">Retry to Login as admin</a></p>');
});
app.get("/userAlreadyExists", (req, res, next) => {
    console.log("Inside get");
    res.send('<h1>Sorry This username is taken </h1><p><a href="/register">Register with different username</a></p>');
});
app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
