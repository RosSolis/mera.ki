/* eslint-env node */
const HTTP = require('http')

const koaStatic = require('koa-static')
const httpShutdown = require('http-shutdown')
const _ = require('lodash')

const config = require('./config.js')
const data = require('./data.js')
const middleware = require('./middleware.js')

const createService = _.once(() => {
	const log = data.getLogger().child({ component: 'service' })
	const application = middleware.createApplication({ log })
	const SERVED_FOLDER = config.get('server.path') // ../served
	application.use(koaStatic(SERVED_FOLDER, { defer: true }))
	const routers = [] // routers handle distinct resources:
	routers.push(middleware.createDataRouter({ data }))
	routers.push(middleware.createLinkRouter({ data }))
	for (const router of routers) {
		application.use(router.routes())
		application.use(router.allowedMethods())
	}
	application.use(middleware.redirectLinks({ data }))
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
