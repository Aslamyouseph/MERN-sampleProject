var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session"); //it is used for handing the session operations
const connectDB = require("./configaration/connection"); // import the connection file

// Connect to MongoDB (configaration folder , connection file )
connectDB();

var { engine } = require("express-handlebars"); // this is the library which is used to set the express view engine
var usersRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var fileUpload = require("express-fileupload"); // used for file uploading (image uploading)

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
//this is used to set  that which folder contain the layout , and partials (because we need to provide tha path of layout and partials for our nodejs)
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "Layout",
    layoutsDir: path.join(__dirname, "views", "layout"),
    partialsDir: path.join(__dirname, "views", "partials"),
  })
);
// It is also used for handling the session
var session = require("express-session");
//it is used for handing the session operations
app.use(
  session({
    secret: "key",
    resave: false, // To avoid session re-saving issues
    saveUninitialized: true, // To ensure uninitialized sessions are stored
    cookie: { maxAge: 600000 }, // Session timeout in ms (10 minutes)
  })
);

app.use(fileUpload()); // used for file uploading (image uploading)
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", usersRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
