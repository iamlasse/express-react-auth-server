/* ================================= SETUP ================================= */

const dotenv = require('dotenv').config();
const dbUname = process.env.DB_UNAME || '';
const dbPwd = process.env.DB_PWD || '';

/* ================================ EXPORTS ================================ */

module.exports = {
	getDbConnectionString: function () {
		// live database
		// return `mongodb://localhost:8081/auth_app`;

		// test database
		return 'mongodb://localhost:27017/auth_app';
	}
};
