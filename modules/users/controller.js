const User = require('../users/model');

module.exports.getUsers = async (req, res) => {
	try {
		const users = await User.find().select('email username');
		console.log(users);
		if (!users) throw new Error('No users');
		res.json({ users });
	} catch (error) {
		res.error(error.message);
	}
};

module.exports.postUsers = (req, res) => {
	console.log(req.query['s']);
	console.log(req.body);
	res.json(req.body);
};

module.exports.getBy = (req, res) => {
	console.log(req.body);

	res.send(`Hello `);
};
