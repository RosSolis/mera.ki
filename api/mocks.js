/* eslint-env node */
process.env.NODE_ENV = 'test'

const Bunyan = require('bunyan')
const _ = require('lodash')

const real = require('./data.js')

const mock = (root = {}) => {
	const defaultLoggerFactory = real.getLogger
	const defaultStorageFactory = real.getStorage
	const log = Bunyan.createLogger({
		component: 'api',
		level: 'fatal',
		name: 'test',
	})
	const get = async (...args) => _.get(root, ...args)
	const set = async (...args) => _.set(root, ...args)
	real.getLogger = () => log
	real.getStorage = _.once(() => Object.freeze({ get, log, set }))
	const clear = () => {
		const copy = Object.assign({}, root)
		for (const key of Object.keys(root)) {
			delete root[key]
		}
		return copy
	}
	const reset = () => {
		real.getLogger = defaultLoggerFactory
		real.getStorage = defaultStorageFactory
	}
	return Object.freeze({ clear, reset })
}

module.exports = mock()
