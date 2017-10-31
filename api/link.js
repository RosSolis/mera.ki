/* eslint-env node */
const crypto = require('crypto')
const { URL } = require('url')

const data = require('./data.js')

const [MIN_ITERATIONS, MAX_ITERATIONS, MAX_MILLISECONDS] = [1, 10, 100]
const [DIGEST_ALGORITHM, DIGEST_BYTES, SALT_BYTES] = ['sha256', 6, 256]

// want to make short-code generation sufficiently complex, random:
const shortenBuffer = secret => new Promise((resolve, reject) => {
	const iterations = Math.floor(MIN_ITERATIONS + (MAX_ITERATIONS - MIN_ITERATIONS) * Math.random())
	const salt = crypto.randomFillSync(Buffer.alloc(SALT_BYTES)) // unique (IV-like) data for nonce
	crypto.pbkdf2(secret, salt, iterations, DIGEST_BYTES, DIGEST_ALGORITHM, (error, buffer) => {
		if (error) reject(error)
		else resolve(buffer)
	})
})

const base64url = buffer => buffer.toString('base64')
	.replace(/\+|\/|=/g, (match) => {
		switch (match) {
		case '+': return '-'
		case '/': return '_'
		default: return ''
		}
	})

const createLink = (longURL, linker, limit = MAX_MILLISECONDS) => {
	const retry = hrtime => shortenBuffer(Buffer.from(longURL))
		.then((shortBuffer) => {
			const value = longURL // e.g. https://google.com
			const key = base64url(shortBuffer) // e.g. bCp7LAVz
			return linker.set(key, value) // to ensure uniqueness
		})
		.catch((shortenError) => {
			const [s, ns] = process.hrtime(hrtime)
			const elapsed = Number(s * 1e3 + ns / 1e6)
			if (elapsed < limit) return retry(hrtime)
			return Promise.reject(shortenError)
		})
	return retry(process.hrtime())
}

const fromStorage = (storage = data.getStorage()) => {
	const log = storage.log.child({ component: 'linker' })
	const path = id => `link.${id}` // data sub-namespace
	const linker = { log, path } // storage-like interface
	linker.get = async (id, ...args) => {
		return storage.get(path(id), ...args)
	}
	linker.set = async (id, ...args) => {
		const longURL = await linker.get(id) // uniqueness
		if (longURL) throw new Error(`duplicate id: ${id} (${longURL})`)
		storage.set(path(id), ...args)
		return id
	}
	linker.clicked = async (id) => {
		const clicks = await storage.get(`click.${id}`)
		const count = 1 + (clicks || 0) // returned
		await storage.set(`click.${id}`, count)
		return count
	}
	linker.shorten = async (maybeURL) => {
		const longURL = new URL(maybeURL) // validity
		return createLink(longURL.toString(), linker)
	}
	return Object.freeze(linker)
}

module.exports = {
	fromStorage,
}

if (!module.parent) {
	require('./mocks.js') // storage, etc.
	const storage = data.getStorage()
	const linker = fromStorage(storage)
	const args = process.execArgv.slice()
	const longURL = new URL(args[0] || 'https://google.com')
	linker.shorten(longURL)
		.then((result) => {
			// eslint-disable-next-line no-console
			console.log(`${result}: ${longURL}`)
			process.exit()
		})
		.catch((reason) => {
			// eslint-disable-next-line no-console
			console.error(reason, 'failure')
			process.exit(1)
		})
}
