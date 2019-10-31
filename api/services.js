/* eslint-env node */
const HTTP = require('http')

// https://www.npmjs.com/package/http-shutdown
const httpShutdown = require('http-shutdown')
// TODO (tohagema): compose the following middleware?
//const koaBodyParser = require('koa-bodyparser')
//const koaCompose = require('koa-compose')
//const koaCompress = require('koa-compress')
//const koaCORS = require('@koa/cors')
//const koaEtag = require('koa-etag')
//const koaFavicon = require('koa-favicon')
//const koaHelmet = require('koa-helmet')
const koaStatic = require('koa-static')
const _ = require('lodash')

const auth = require('./auth.js')
const config = require('./config.js')
const data = require('./data.js')

// provides factories for routers, etc.
const middleware = require('./middleware.js')

const koaSessionProbe = ({ application, data, log }) => {
	const keys = [config.getSecrets().session || 'mera.ki']
	auth.setupSession({ key: 'meraki' }, application, { keys })
	return async function probe ({ omnibus, request, session }, next) {
		const req = _.omit(request, ['header']) // no Authorization
		omnibus.log.debug({ req, session }, 'probe')
		await next()
	}
}

const createService = _.once(() => {
	const log = data.getLogger().child({ component: 'service' })
	const application = middleware.createApplication({ log })
	const SERVED_FOLDER = config.get('server.path') // ../served
	application.use(koaStatic(SERVED_FOLDER, { defer: true }))
	application.use(koaSessionProbe({ application, data, log }))
	const routers = [] // routers handle distinct resources:
	routers.push(middleware.createAuthRouter({ data }))
	routers.push(middleware.createDataRouter({ data }))
	routers.push(middleware.createLinkRouter({ data }))
	for (const router of routers) {
		application.use(router.allowedMethods())
		application.use(router.routes())
	}
	// This middleware should always be last: (fall-back)
	application.use(middleware.redirectLinkIDs({ data }))
	// a "service" is (for now) just an Object w/ logger + server
	const server = HTTP.createServer(application.callback())
	return Object.freeze({ log, server: httpShutdown(server) })
})

const startService = ({ log, server }, { port }) => {
	return new Promise((resolve, reject) => {
		server.on('error', (error) => {
			if (!server.listening) reject(error)
			else log.warn(error, 'internal failure')
		})
		server.once('listening', () => {
			log.info({ port }, 'listening')
			resolve(server)
		})
		server.listen(port)
	})
}

const stopService = ({ server }, { timeout }) => {
	return new Promise((resolve, reject) => {
		server.shutdown(resolve) // as graceful as possible
		const message = `failed to stop within ${timeout}ms`
		setTimeout(reject, timeout, new Error(message))
	})
}

module.exports = {
	createService,
	startService,
	stopService,
}
