function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		console.log('You are not logged in!');
		res.statusCode = 401;
		res.setHeader('Content-Type', 'application/json');
		res.json({ success: false, status: 'You are not logged in!' });
	}
}

exports.isLoggedIn = isLoggedIn;
