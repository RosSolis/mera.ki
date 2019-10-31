/* eslint-env node */
const path = require('path')

const _ = require('lodash')

const DEFAULT_PORT_NUMBER = 8080 // alternative HTTP

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SERVER_PATH = path.resolve(PROJECT_ROOT, 'served')
const DATA_PATH = path.resolve(PROJECT_ROOT, 'data.json')
const LOG_PATH = path.resolve(PROJECT_ROOT, 'server.log')

// simple alternative to require('config'):

const config = {
	data: {
		path: process.env.DB_PATH || DATA_PATH,
	},
	log: {
		level: process.env.LOG_LEVEL || 'debug',
		name: process.env.LOG_NAME || 'mera.ki',
		path: process.env.LOG_PATH || LOG_PATH,
	},
	server: {
		path: process.env.SERVED_PATH || SERVER_PATH,
		port: process.env.PORT || DEFAULT_PORT_NUMBER,
	},
}

const deepFreeze = (object, visited = new WeakSet()) => {
	if (!object || typeof object !== 'object' || visited.has(object)) return
	visited.add(object) // prevents recursion over nested Object references
	for (const key of Object.keys(object)) deepFreeze(object[key], visited)
	Object.freeze(object) // base case: prevent modifications (on post-order)
}

const getValue = (frozenObject, maybeKey) => {
	const key = maybeKey || '' // prevent undefined
	if (_.has(config, key)) return _.get(config, key)
	throw new Error(`FATAL: missing config (${key})`)
}

const secrets = {}
try {
	// eslint-disable-next-line global-require
	Object.assign(secrets, require('./secrets.js'))
} catch (error) {
	// eslint-disable-next-line no-console
	console.error(error, 'WARNING: missing api/secrets.js')
} finally {
	deepFreeze(config)
	deepFreeze(secrets)
}

module.exports = {
	get: key => getValue(config, key),
	getSecrets: (...args) => {
		if (args.length === 0) return secrets
		return getValue(secrets, ...args)
	},
}
