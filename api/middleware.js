/* eslint-env node */
const { URL } = require('url')

const Boom = require('boom')
const KoaRouter = require('koa-router')
const omnibus = require('koa-omnibus')

const parse = require('co-body')

const link = require('./link.js')

class DataRouter extends KoaRouter {

	constructor ({ data, prefix = '/api/data' }) {
		super({ prefix }) // e.g. GET /api/data/:key => :value
		const storage = data.getStorage() // simple interface
		this.get('/:key', async ({ params, response }) => {
			const value = await storage.get(params.key)
			if (value) response.body = value
			else response.status = 204
		})
		// use e.g. `curl` to POST valid JSON to /api/data
		this.post('/', async ({ request, response }) => {
			const before = {} // < included in response:
			const after = await parse.json(request)
			for (const [key, value] of Object.entries(after)) {
				before[key] = await storage.get(key) // or: undefined
				await storage.set(key, value) // will be written on sync
			}
			response.body = { before, after }
		})
	}

}

class LinkRouter extends KoaRouter {

	constructor ({ data, prefix = '/api/link' }) {
		super({ prefix })
		const links = link.fromStorage(data.getStorage())
		this.get('/:id', async ({ params, response }) => {
			const longURL = await links.get(params.id)
			if (!longURL) throw new Boom.notFound(params.id)
			response.body = longURL // always status: 200 OK
		})
		this.post('/', async ({ omnibus, request, response }) => {
			try {
				const longURL = new URL(await parse.text(request)) // relative to request.origin:
				const shortURL = new URL(`/link?id=${await links.shorten(longURL)}`, request.origin)
				Object.assign(response, { body: shortURL.toString(), status: 201 })
				omnibus.log.info({ longURL, shortURL }, 'created new URL link')
			} catch (error) {
				omnibus.log.warn({ err: error }, 'failed to create link (invalid URL?)')
				throw Boom.badRequest('URL invalid; please retry or contact administrator.')
			}
		})
	}

}

const createApplication = ({ log }) => omnibus.createApplication({
	targetLogger: (options, context, fields) => log.child(fields),
})

const createDataRouter = options => new DataRouter(options)

const createLinkRouter = options => new LinkRouter(options)

const redirectLinks = ({ data }) => {
	const links = link.fromStorage(data.getStorage())
	return async function redirect ({ omnibus, query, request, response }, next) {
		if (request.method !== 'GET' || request.path !== '/link') return next()
		const longURL = await links.get(query.id)
		if (longURL) {
			omnibus.log.info({ query }, '/link (redirect found)')
			const clicks = Number(await links.clicked(query.id))
			response.set('X-Redirect-Count', clicks.toFixed(0))
			response.redirect(longURL) // w/ status 302 Found
		} else {
			omnibus.log.warn({ query }, '/link (not found))')
		}
		await next()
	}
}

module.exports = {
	createApplication,
	createDataRouter,
	createLinkRouter,
	redirectLinks,
}
