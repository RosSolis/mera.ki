/* eslint-env node */
const config = require('./config.js')
const data = require('./data.js')
const services = require('./services.js')

module.exports = services

if (!module.parent) {
	const port = config.get('server.port')
	const service = services.createService()
	const timeout = 500 // in milliseconds
	services.startService(service, { port })
		.then(() => {
			// N.B. node-inspect uses SIGUSR1
			process.on('SIGUSR2', () => {
				service.log.info('will sync data, logs')
				data.getLogger().reopenFileStreams()
				process.emit('sync') // see data.js
			})
			const die = (signal) => {
				process.emit('sync') // blocking
				process.kill(process.pid, signal)
			}
			for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM']) {
				process.once(signal, () => {
					services.stopService(service, { timeout })
					setTimeout(die, timeout, signal)
				})
			}
		})
		.catch((error) => {
			service.log.fatal(error, 'will terminate')
			setTimeout(() => process.exit(1), timeout)
		})
}
