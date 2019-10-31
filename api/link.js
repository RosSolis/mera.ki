/* eslint-env node */
const crypto = require('crypto')
const { URL } = require('url')

const data = require('./data.js')

const [MIN_ITERATIONS, MAX_ITERATIONS, MAX_MILLISECONDS] = [1, 10, 100]
const [DIGEST_ALGORITHM, DIGEST_BYTES, SALT_BYTES] = ['sha256', 4, 256]

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
	const path = id => `links.?${id}` // data sub-namespace
	const linker = { log, path } // storage-like interface
	linker.get = async (id, ...args) => {
		return storage.get(path(id), ...args)
	}
	linker.set = async (id, ...args) => {
		const longURL = await linker.get(id) // link IDs must be unique:
		if (longURL) throw new Error(`duplicate id: ${id} (${longURL})`)
		storage.set(path(id), ...args)
		return id
	}
	linker.clicked = async (id, add = 1) => {
		const path = `clicks.?${id}` // per link
		const before = await storage.get(path)
		const after = add + (before || 0)
		await storage.set(path, after)
		return after
	}
	linker.shorten = async (inputURL, baseURL) => {
		const validURL = new URL(inputURL, baseURL)
		return createLink(validURL.toString(), linker)
	}
	return Object.freeze(linker)
}

module.exports = {
	fromStorage,
}
