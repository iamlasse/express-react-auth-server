var LocalStrategy = require('passport-local').Strategy;
var User = require('../../modules/users/model');

module.exports = function(passport) {
	passport.use(
		'local-login',
		new LocalStrategy(
			{
				usernameField: 'email',
				passwordField: 'password',
				passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
			},
			function(req, username, password, done) {
				console.log('Passport local login: ', username, password);

				let email = null;
				if (req.body.email) email = req.body.email.toLowerCase(); // Use lower-case email to avoid case-sensitive email matching
				if (username) username = username.toLowerCase(); // Use lower-case usernames/emails to avoid case-sensitive e-mail/username matching
				//trying to find submited username in Datebase
				User.findOne({ 'local.username': username }, function(err, user) {
					// if there are any errors, return the error
					if (err) return done(err);
					else if (!user) {
						// if no user is found by username, we try to find user by email
						User.findOne({ 'local.email': username }, function(err, user) {
							// if there are any errors, return the error
							if (err) return done(err);
							else if (!user)
								// if no user is found, return the message
								return done(null, false, {
									message: 'Wrong password or username/email'
								});
							else if (!user.validPassword(password))
								return done(null, false, {
									message: 'Wrong password or username/email'
								});
							else
								// all is well, return user
								return done(null, user);
						});
					} else if (!user.validPassword(password))
						return done(null, false, {
							message: 'Wrong password or username/email'
						});
					else
						// all is well, return user
						return done(null, user);
				});
			}
		)
	);
};
