const express = require('express');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
// cors --
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('cookie-session');
const passport = require('passport');
const flash = require('connect-flash');
const appCors = require('./config/cors');
const config = require('./config');

// db
const db = require('./db');
mongoose.promise = global.Promise;

// Load dotenv file
require('dotenv').load();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(require('easy-livereload')());

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(appCors);
app.use(cookieParser(config.secret));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
	session({
		keys: [
			'secret'
		],
		secret: config.secret,
		overwrite: true,
		maxAge: 60000
	})
);

app.use(flash());

var Account = require('./modules/users/model');
// passport config
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

/** Routes */
const routes = require('./routes/index');

app.use('/api', routes);
// app.use('/users', passport.authenticate('jwt', { session: false }), usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	console.log('Error handled from route: ', JSON.stringify(err));

	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.json({ error: { message: err.message } });
});

mongoose.connect(db.getDbConnectionString(), { useNewUrlParser: true });

mongoose.connection.on('connection', function () {
	console.log('Mongo connected');
});

mongoose.connection.on('error', function (error) {
	console.error('Mongoose connection error: ', error);
});

module.exports = app;
