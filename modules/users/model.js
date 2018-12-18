const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const User = new Schema(
	{
		name: String,

		local: {
			username: String,
			password: String,
			hash: String,
			salt: String,
			email: {
				type: String,
				unique: true
			}
		},

		facebook: {
			id: String,
			token: String,
			name: String,
			email: {
				type: String
			}
		},

		google: {
			id: String,
			token: String,
			name: String,
			email: {
				type: String
			}
		},
		joined: {
			type: Date
		},
		lastLoggedIn: Date
	},
	{
		timestamps: true
	}
);

var genRandomString = function(length) {
	return crypto
		.randomBytes(Math.ceil(length / 2))
		.toString('hex') /** convert to hexadecimal format */
		.slice(0, length); /** return required number of characters */
};

User.methods.generateHash = function(password) {
	console.log('Encrypt password: ', password);

	this.local.salt = genRandomString(32);
	this.local.hash = crypto
		.pbkdf2Sync(password, this.local.salt, 10000, 512, 'sha512')
		.toString('hex');
};

User.methods.validPassword = function(password) {
	const hash = crypto
		.pbkdf2Sync(password, this.local.salt, 10000, 512, 'sha512')
		.toString('hex');
	return this.local.hash === hash;
};

User.methods.toAuthJSON = function() {
	return {
		id: this._id,
		email: this.local.email,
		token: this.generateJWT()
	};
};

User.methods.generateJWT = function() {
	const today = new Date();
	const expirationDate = new Date(today);
	expirationDate.setDate(today.getDate() + 60);

	const options = {};

	return jwt.sign(
		{
			email: this.local.email,
			sub: this._id,
			exp: parseInt(expirationDate.getTime() / 1000, 10)
		},
		config.secret,
		options
	);
};

User.pre('save', function hashPassword(next) {
	next();
});

module.exports = mongoose.model('User', User);
