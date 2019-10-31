/* eslint-env node */
const crypto = require('crypto')

const Boom = require('boom')
//const JWT = require('jsonwebtoken')
const koaCompose = require('koa-compose')
const koaPassport = require('koa-passport')
const koaSession = require('koa-session')
const passport = require('passport')
const _ = require('lodash')

const BasicStrategy = require('passport-http').BasicStrategy
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const secrets = require('./config.js').getSecrets() // google / users

const setupStrategies = _.once(() => {
	const sameSecret = (actual, expected) => {
		const nonce = crypto.randomFillSync(Buffer.alloc(32)) // doesn't this consume entropy?
		const digest = input => crypto.createHmac('sha256', nonce).update(input, 'utf8').digest()
		return crypto.timingSafeEquals(digest(actual), digest(expected)) // avoids timing attacks
	}
	// passport-google-oauth requires mutable options?
	const hack = Object.assign({}, secrets.google || {})
	const users = _.keyBy(secrets.users || [], 'username')
	passport.deserializeUser((user, done) => done(null, user))
	passport.serializeUser((user, done) => done(null, user))
	passport.use(new BasicStrategy((username, password, done) => {
		const user = users[username] || null // has password, etc.
		const valid = sameSecret(password, Object(user).password)
		done(valid ? null : new Error('nope'), user)
	}))
	passport.use(new GoogleStrategy(hack, (accessToken, refreshToken, plusProfile, done) => {
		done(null, { token: accessToken })
	}))
})

const setupSession = (config, application, ...args) => {
	Object.assign(application, ...args)
	setupStrategies() // this setup is one-time
	application.use(koaSession(config, application))
	application.use(koaPassport.initialize())
	application.use(koaPassport.session())
}

const useSession = (/* storage */) => {
	const defer = async (context, next) => {
		try {
			await next() // try to authenticate
			context.redirect('/') // on success
		} catch (error) {
			throw new Boom.badRequest('invalid credentials')
		}
	}
	const failure = async (context) => {
		const hasAuthorization = !!context.get('authorization') // Authorization was invalid if present
		throw Boom.unauthorized(hasAuthorization ? 'invalid Authorization' : 'missing Authorization')
	}
	const login = koaCompose([
		defer, // will await (and catch Error from) passport:
		koaPassport.authenticate('basic', { session: false }),
	])
	const logout = async (context, next) => {
		context.logout() // await?
		context.redirect('/')
		return next()
	}
	const success = async (context, next) => {
		context.redirect('/')
		return next()
	}
	const toGoogle = koaCompose([
		koaPassport.authenticate('google', {
			scope: [
				// from Google {Analytics API (v3), OAuth2 API (v2), URL Shortener API (v1)}
				// Documentation: https://developers.google.com/identity/protocols/googlescopes
				//'https://www.googleapis.com/auth/analytics.edit', // Edit Google Analytics management entities
				//'https://www.googleapis.com/auth/analytics.manage.users', // Manage Google Analytics Account users by email address
				//'https://www.googleapis.com/auth/analytics.manage.users.readonly', // View Google Analytics user permissions
				//'https://www.googleapis.com/auth/analytics.provision', // Create a new Google Analytics account
				//'https://www.googleapis.com/auth/analytics.readonly', // View your Google Analytics data
				'https://www.googleapis.com/auth/analytics', // View and manage your Google Analytics data
				//'https://www.googleapis.com/auth/plus.login', // Know the list of people in your circles, age range, and language
				//'https://www.googleapis.com/auth/plus.me', // Know who you are on Google
				'https://www.googleapis.com/auth/urlshortener', // Manage your goo.gl short URLs
				'https://www.googleapis.com/auth/userinfo.email', // View your email address
				//'https://www.googleapis.com/auth/userinfo.profile', // View your basic profile info
				// Also, see: https://developers.google.com/identity/one-tap/web/idtoken-auth
			],
		})
	])
	const fromGoogle = koaCompose([
		koaPassport.authenticate('google', {
			failureRedirect: '/auth/failure',
			successRedirect: '/auth/success',
		})
	])
	return async (context, next) => {
		if (context.method !== 'GET') {
			throw Boom.methodNotAllowed('try GET method')
		}
		if (context.request.href.startsWith(secrets.google.callbackURL)) {
			return fromGoogle(context, next)
		}
		switch (context.url) {
		case '/auth/failure': return failure(context, next)
		case '/auth/google': return toGoogle(context, next)
		case '/auth/login': return login(context, next)
		case '/auth/logout': return logout(context, next)
		case '/auth/success': return success(context, next)
		default: throw Boom.notImplemented('try GET /auth/login')
		}
	}
}

module.exports = {
	setupSession,
	useSession,
}
