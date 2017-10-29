/* eslint-env node */
const path = require('path')

const _ = require('lodash')

const DEFAULT_PORT_NUMBER = 8080 // alternative HTTP

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SERVER_PATH = path.resolve(PROJECT_ROOT, 'served')
const DATA_PATH = path.resolve(PROJECT_ROOT, 'data.json')
const LOG_PATH = path.resolve(PROJECT_ROOT, 'server.log')

// simple alternative to require('config'):

const all = Object.freeze({
	data: Object.freeze({
		path: process.env.DB_PATH || DATA_PATH,
	}),
	log: Object.freeze({
		level: process.env.LOG_LEVEL || 'debug',
		name: process.env.LOG_NAME || 'mera.ki',
		path: process.env.LOG_PATH || LOG_PATH,
	}),
	server: Object.freeze({
		path: process.env.SERVED_PATH || SERVER_PATH,
		port: process.env.PORT || DEFAULT_PORT_NUMBER,
	}),
})

module.exports = {
	get: key => _.get(all, key),
}
