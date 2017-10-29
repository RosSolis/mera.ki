/* eslint-env node */
process.env.NODE_ENV = 'test'

const Bunyan = require('bunyan')
const _ = require('lodash')

const real = require('./data.js')

const mock = (data = {}) => {
	const defaultLoggerFactory = real.getLogger
	const defaultStorageFactory = real.getStorage
	const log = Bunyan.createLogger({
		component: 'api',
		level: 'fatal',
		name: 'test',
	})
	const all = () => data
	const get = (...args) => _.get(data, ...args)
	const set = (...args) => _.set(data, ...args)
	real.getLogger = () => log
	real.getStorage = _.once(() => Object.freeze({ all, log, get, set }))
	const undo = () => {
		real.getLogger = defaultLoggerFactory
		real.getStorage = defaultStorageFactory
	}
	return Object.freeze({ data, undo })
}

module.exports = mock()
