/* eslint-env node */
const KoaRouter = require('koa-router')
const omnibus = require('koa-omnibus')

const parse = require('co-body')
const _ = require('lodash')

class DataRouter extends KoaRouter {

	constructor ({ data, prefix = '/api/data' }) {
		super({ prefix }) // e.g. GET /api/data/:key => :value
		const storage = data.getStorage() // simple interface
		this.get('/:key', async ({ params, response }) => {
			const key = _.get(params, 'key', '') // key:String
			const value = storage.get(key, null) // value:JSON
			if (key && value) response.body = value
			else response.status = 204 // No Content
		})
		// use e.g. `curl` to POST valid JSON to /api/data
		this.post('/', async ({ request, response }) => {
			const before = {} // < included in response:
			const after = await parse.json(request)
			for (const [key, value] of Object.entries(after)) {
				before[key] = storage.get(key) // or: undefined
				storage.set(key, value) // will be written on sync
			}
			response.body = { before, after }
		})
		Object.freeze(this)
	}

}

const createApplication = (...args) => {
	const options = Object.assign({}, ...args)
	return omnibus.createApplication(options)
}

const createDataRouter = (...args) => {
	const options = Object.assign({}, ...args)
	return new DataRouter(options)
}

module.exports = {
	createApplication,
	createDataRouter,
}
