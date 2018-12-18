const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../modules/users/model');
const config = require('../config');
const isLoggedIn = require('./common').isLoggedIn;
const { OAuth2Client } = require('google-auth-library');

function extractUserInfo(userFromReq) {
	userFromReq.google.id ? (isGoogleLinked = true) : (isGoogleLinked = false);
	userFromReq.facebook.id ? (isFBLinked = true) : (isFBLinked = false);

	console.log('User from request: ', userFromReq);

	return (userInfo = {
		name: userFromReq.name,
		email: userFromReq.local.email,
		username: userFromReq.local.username,
		isGoogleLinked,
		isFBLinked
	});
}

router.get('/signout', (req, res) => {
	if (req.user) {
		req.logout();
		req.session.destroy();
		return res.json({ msg: 'logging you out' });
	} else {
		return res.json({ msg: 'no user to log out!' });
	}
});

router.get('/me', passport.authenticate('jwt'), (req, res, next) => {
	const { user } = req;
	if (!user) return res.status(401).error({ authenticated: req.isAuthenticated() });
	return res.json({ user: extractUserInfo(user), authenticated: req.isAuthenticated() });
});

router.post('/change_password', isLoggedIn, function(req, res, next) {
	var user = req.user;
	// checking if don't have current local password or provided password is valid
	if (!user.local.password || user.validPassword(req.body.oldPassword)) {
		// if true - assign new password
		user.local.password = user.generateHash(req.body.password);
		user.save().then(
			user => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json({
					success: true,
					status: 'Password successfully changed'
				});
				return;
			},
			err => {
				console.log(err);
				return next(err);
			}
		);
		// if not valid - send error message
	} else {
		res.statusCode = 401;
		res.setHeader('Content-Type', 'application/json');
		return res.json({ success: false, status: 'Wrong password' });
	}
});

router.post('/delete_account', isLoggedIn, function(req, res, next) {
	User.findById(req.user._id, function(err, user) {
		if (err) {
			return res.json({ success: false, status: err });
		}
		if (!user.local.password) {
			res.statusCode = 401;
			res.setHeader('Content-Type', 'application/json');
			return res.json({ success: false, status: "You don't have password." });
		}
		// checking if provided password is valid
		if (user.validPassword(req.body.password)) {
			User.findByIdAndRemove(req.user._id, function(err, user) {
				if (err) {
					return res.json({ success: false, status: err });
				}
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, status: 'Account succesfully deleted' });
				return;
			});
		} else {
			res.statusCode = 401;
			res.setHeader('Content-Type', 'application/json');
			return res.json({ success: false, status: 'Wrong password' });
		}
	});
});

router.post('/change_email', isLoggedIn, function(req, res, next) {
	// checking if provided email already in use
	User.findOne({ 'local.email': req.body.email }, function(err, user) {
		if (err) {
			console.log(err);
			return next(err);
		}
		// if user with such email exist - send error message
		if (user) {
			res.statusCode = 401;
			res.setHeader('Content-Type', 'application/json');
			return res.json({
				success: false,
				status: 'This email is already in use'
			});
		}

		User.findById(req.user._id, function(err, user) {
			if (err) {
				return res.json({ success: false, status: err });
			}
			user.local.email = req.body.email;
			user.save().then(
				user => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json({
						success: true,
						status: 'Email successfully changed',
						email: user.local.email
					});
					return;
				},
				err => {
					console.log(err);
					return next(err);
				}
			);
		});
	});
});

router.post('/signup', function(req, res, next) {
	passport.authenticate('local-signup', function(err, user, info) {
		if (err) {
			console.log(err);
			return next(err);
		}
		if (user) {
			req.logIn(user, function(err) {
				if (err) {
					return next(err);
				}
				return res.status(200).json({
					success: true,
					status: 'You have successfully signed up!',
					user: extractUserInfo(req.user),
					token: user.generateJWT()
				});
			});
		} else {
			return res.status(401).json({ success: false, status: info.message });
		}
	})(req, res, next);
});

router.post('/signin', function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		if (err) {
			console.log(err);
			return next(err);
		}
		if (user) {
			req.login(user, function(err) {
				if (err) {
					console.log(err);
					return next(err);
				}

				const token = user.generateJWT();

				return res.status(200).json({
					success: true,
					status: 'You have successfully signed in!',
					user: extractUserInfo(req.user),
					token
				});
			});
		} else {
			return res.status(401).json({ success: false, status: info.message });
		}
	})(req, res, next);
});

router.post('/unlink', isLoggedIn, (req, res, next) => {
	user = req.user;
	var social = req.body.social;
	if (social) {
		user[social] = undefined;
	}
	user.save().then(
		() => {
			return res.status(200).json({ status: 'Account successfully unlinked' });
			return;
		},
		err => {
			console.log(err);
			return next(err);
		}
	);
});

// facebook -------------------------------

// send to facebook to do the authentication
router.get(
	'/facebook',
	passport.authenticate('facebook', {
		scope: [
			'public_profile',
			'email'
		]
	})
);

// handle the callback after facebook has authenticated the user

router.get('/facebook/callback', function(req, res, next) {
	passport.authenticate('facebook', function(err, user, info) {
		if (err) {
			console.log(err);
			return next(err);
		}
		if (user) {
			req.logIn(user, function(err) {
				if (err) {
					console.log('error when logging in');
					return next(err);
				}
				message = info.message;
				if (message) {
					res.redirect(baseURL + info.message);
				} else {
					res.redirect(baseURL);
				}
				return;
			});
		} else {
			res.redirect(baseURL + 'login');
			return;
		}
	})(req, res, next);
});

// google ---------------------------------

// send to google to do the authentication
router.get(
	'/google',
	passport.authenticate('google', {
		scope: [
			'profile',
			'email',
			'openid'
		]
	})
);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function verify(token) {
	const payload = await client.getTokenInfo(token);
	const userid = payload['sub'];
	return { userid, payload };
}

router.post('/google', async function(req, res, next) {
	try {
		const { userid, payload } = await verify(req.body.access_token);

		console.log('Found user: ', payload);
		const user = await User.findOneAndUpdate(
			{
				$or: [
					{ 'google.email': payload.email },
					{ 'local.email': payload.email }
				]
			},
			{
				'google.token': payload.token,
				'google.id': payload.id,
				lastLoggedIn: new Date()
			},
			{ upsert: true }
		);
		console.log('Found user: ', user);

		if (user) return res.json({ user: user.toAuthJSON() });
		console.log('Verified google request: ', payload);
	} catch (error) {
		console.error(error);
	}
});

router.get('/google/callback', function(req, res, next) {
	passport.authenticate('google', function(err, user, info) {
		if (err) {
			console.log(err);
			return next(err);
		}
		if (user) {
			req.login(user, function(err) {
				if (err) {
					console.log('error when logging in');
					return next(err);
				}

				console.log('Logged in after auth with google: ', user, info);

				message = info.message;
				if (message) {
					return res.json(info.message);
				} else {
					return res.json(user.toAuthJSON());
				}
			});
		} else {
			return res.json('login');
		}
	})(req, res, next);
});

module.exports = router;
