'use strict';

module.exports = {
	development: {
		client: 'pg',
		debug: true,

		connection: {
			host: '127.0.0.1',
			database: 'twyr',
			user: 'twyr',
			password: 'twyr'
		},

		migrations: {
			tableName: 'rest_api_server_migrations'
		}
	},

	stage: {
		client: 'pg',
		debug: true,

		connection: {
			host: '127.0.0.1',
			database: 'twyr',
			user: 'twyr',
			password: 'twyr'
		},

		migrations: {
			tableName: 'rest_api_server_migrations'
		}
	},

	test: {
		client: 'pg',
		debug: true,

		connection: {
			host: '127.0.0.1',
			database: 'twyr',
			user: 'twyr',
			password: 'twyr'
		},

		migrations: {
			tableName: 'rest_api_server_migrations'
		}
	},

	production: {
		client: 'pg',
		debug: false,

		connection: {
			host: '127.0.0.1',
			database: 'twyr',
			user: 'twyr',
			password: 'twyr'
		},

		migrations: {
			tableName: 'rest_api_server_migrations'
		}
	}
};
