const passport = require('passport');
const User = require('../modules/users/model');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
var localLogin = require('./strategies/localLogin');
var localSignUp = require('./strategies/localSignUp');
var facebookAuth = require('./strategies/facebookAuth');
var googleAuth = require('./strategies/googleAuth');
const config = require('../config');

passport.use(
	'jwt',
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: config.secret
		},
		async function(jwtPayload, done) {
			console.log('Authenticate user with JWT: ', jwtPayload);

			// find the user in db if needed
			try {
				const user = await User.findById(jwtPayload.sub, 'local.email local.username');

				console.log(user);

				if (!user) return done(null, false, { message: 'No User found...' });

				return done(null, user);
			} catch (error) {
				return done(error, false);
			}
		}
	)
);

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
	console.log('Serialize user: ', user);

	done(null, user);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
	console.log('Deserialize User: ', id);

	User.findById(id).exec(function(err, user) {
		done(err, user);
	});
});

localLogin(passport);
localSignUp(passport);
googleAuth(passport);
facebookAuth(passport);
