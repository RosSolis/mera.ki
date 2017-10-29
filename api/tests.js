/* eslint-env mocha, node*/
const assert = require('assert')
const supertest = require('supertest')

const mock = require('./mocks.js')
const real = require('./index.js')

describe('data API', () => {

	const data = { key: 'value' }
	const test = {} // see before

	before(() => {
		Object.assign(test, real.createService())
		return supertest(test.server)
			.post('/api/data')
			.send(data)
			.expect(200, { before: {}, after: data })
	})

	it('can read JSON previously written', () => {
		const key = 'key'
		return supertest(test.server)
			.get(`/api/data/${key}`)
			.expect(200, data[key])
	})

	after(() => {
		assert.deepStrictEqual(mock.data, data)
	})

})
