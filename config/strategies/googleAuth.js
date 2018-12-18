var User = require('../../modules/users/model');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

function extractProfile(profile) {
	console.log('Profile to extract: ', profile);

	let imageUrl = '';
	if (profile.photos && profile.photos.length) {
		imageUrl = profile.photos[0].value;
	}
	return {
		id: profile.id,
		displayName: profile.displayName,
		image: imageUrl
	};
}

module.exports = function(passport) {
	// console.log('Google: ', process.env.GOOGLE_CLIENT_ID);

	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				//callbackURL: process.env.baseURL + process.env.GOOGLE_CALLBACK_URL,
				accessType: 'offline',
				passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
			},
			function(req, accessToken, refreshToken, profile, done) {
				// console.log('Extracted profile info: ', extractProfile(profile));
				// check if the user is already logged in
				if (profile) {
					User.findOne(
						{
							$or: [
								{ 'google.id': profile.id },
								{ 'local.email': profile.emails[0].value.toLowerCase() }
							]
						},
						function(err, user) {
							if (err) return done(err);
							console.log('Found user: ', user);

							if (user) {
								console.log('User has google: ', user.google);

								// if there is a user id already but no token (user was linked at one point and then removed)
								if (!user.google.token) {
									user.google.id = profile.id;
									user.google.token = accessToken;
									user.google.name = profile.displayName;
									user.google.email = (profile.emails[0].value || '')
										.toLowerCase(); // pull the first email

									user.save(function(err) {
										if (err) return done(err);

										return done(null, user);
									});
								}

								return done(null, user);
							} else {
								var newUser = new User();

								newUser.google.id = profile.id;
								newUser.google.token = accessToken;
								newUser.google.name = profile.displayName;
								newUser.google.email = (profile.emails[0].value || '')
									.toLowerCase(); // pull the first email
								newUser.name = profile.displayName;

								newUser.save(function(err) {
									if (err) return done(err);

									return done(null, newUser);
								});
							}
						}
					);
				} else {
					// user already exists and is logged in, we have to link accounts
					// var user = req.user; // pull the user out of the session
					User.findOne({ 'google.id': profile.id }, function(err, googleUser) {
						if (err) return done(err);
						// check if this google account is already in use, if it exists, don't link account
						if (googleUser) {
							return done(null, user, {
								message: 'error/This account already in use.'
							});
						}
						// user.google.id = profile.id;
						// user.google.token = token;
						// user.google.name = profile.displayName;
						// user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
						// user.save(function(err) {
						// 	if (err) return done(err);
						// 	return done(null, user, {
						// 		message: 'success/You successfully linked your Google account.'
						// 	});
						// });
					});
				}
			}
		)
	);
};
