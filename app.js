const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
// @todo: const { checkServerIdentity } = require('tls');
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const envHelper = require('./helpers/envHelper');

// Connect to the database.
let mongoDB = undefined;

if (process.env.NODE_ENV === 'test') {
  // If we are running in test mode, use the temporary MongoDB In-Memory Server.
  // This environment variable is set by Jest and/or the MongoDB In-Memory
  // Server; we don't need to set it explicitly.
  mongoDB = process.env.MONGO_URL;
}
else {
  // Check that the required environment variables are defined.
  envHelper.checkEnvVarIsDefinedOrExit('API_PORT', isEmptyOk = false);
  envHelper.checkEnvVarIsDefinedOrExit('DB_API_USERNAME', isEmptyOkay = false);
  envHelper.checkEnvVarIsDefinedOrExit('DB_API_PASSWORD', isEmptyOkay = false);
  envHelper.checkEnvVarIsDefinedOrExit('DB_HOST', isEmptyOkay = false);
  envHelper.checkEnvVarIsDefinedOrExit('DB_PORT', isEmptyOkay = false);

  // In all other modes (dev, production, etc.), use a real MongoDB instance.
  mongoDB = `mongodb://${process.env.DB_API_USERNAME}:${process.env.DB_API_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/mylife?authSource=mylife`;
}

mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Initialize the app.
const app = express();

// Set up the view engine.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configure bodyparser to handle post requests.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', indexRouter);
app.use('/api', apiRouter);

// Catch 404 errors and forward to the error handler.
app.use((req, res, next) => {
  next(createError(404));
});

// The error handler.
app.use((err, req, res, next) => {
  // Set locals, only providing error in development.
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page.
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
