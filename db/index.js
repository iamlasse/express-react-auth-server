/* ================================= SETUP ================================= */

const dotenv = require('dotenv').config();
const dbUname = process.env.DB_UNAME || '';
const dbPwd = process.env.DB_PWD || '';

/* ================================ EXPORTS ================================ */

module.exports = {
	getDbConnectionString: function() {
		// live database
		return `mongodb://localhost/auth_app`;

		// test database
		//        return `mongodb://${dbUname}:${dbPwd}@ds161503.mlab.com:61503/co-ment-test`;
	}
};
