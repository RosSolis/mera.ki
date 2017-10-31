/* eslint-env node */
const fs = require('fs')

const Bunyan = require('bunyan')
const _ = require('lodash')

const config = require('./config.js')

const getLogger = _.once(() => {
	const serializersEnabled = Object.assign({}, Bunyan.stdSerializers)
	const streamInMemory = new Bunyan.RingBuffer({ limit: 1024 })
	const streamsEnabled = [{ stream: process.stdout }]
	streamsEnabled.push({
		count: 90, // rotated daily
		path: config.get('log.path'),
		type: 'rotating-file',
	})
	streamsEnabled.push({
		level: 'trace',
		stream: streamInMemory,
		type: 'raw',
	})
	// writes to three streams, in this order:
	// RAM buffer -> file on disk -> stdout
	const log = Bunyan.createLogger({
		level: config.get('log.level'),
		name: config.get('log.name'),
		serializers: serializersEnabled,
		streams: streamsEnabled.reverse(),
	})
	// Bunyan's Logger extends EventEmitter:
	log.on('error', (error) => {
		// eslint-disable-next-line no-console
		console.error(error) // cheap fall-back
	})
	// and tracks state in a tree structure:
	return log.child({ component: 'data' })
})

const getStorage = _.once(() => {
	const DATA_NAMESPACE = 'mera.ki' // default
	const DATA_PATH = config.get('data.path')
	const log = getLogger()
		.child({
			component: 'storage',
		})
	const all = _.once(() => {
		try {
			const buffer = fs.readFileSync(DATA_PATH) // to prevent accidents:
			fs.writeFileSync(`${DATA_PATH}.${Date.now()}.backup`, buffer)
			return JSON.parse(buffer)
		} catch (error) {
			log.warn({ err: error }, 'read/parse JSON failed')
			return { [DATA_NAMESPACE]: {} } // initial state
		}
	})
	process.on('sync', () => {
		const data = all() // will only read once
		fs.writeFileSync(DATA_PATH, JSON.stringify(data))
		log.info({ data, path: DATA_PATH }, 'saved JSON to file')
	})
	const root = all()[DATA_NAMESPACE] // pay loading cost upfront (eager read)
	const get = async (keyPath, defaultValue) => _.get(root, keyPath, defaultValue)
	const set = async (keyPath, newValue) => _.set(root, keyPath, newValue)
	return Object.freeze({ get, log, set }) // storage interface
})

module.exports = {
	getLogger,
	getStorage,
}
