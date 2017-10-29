/* eslint-env node */
module.exports = {

	extends: [
		'eslint:recommended',
		'plugin:import/recommended',
		'plugin:mocha/recommended',
		'plugin:react/recommended',
		'react-app',
	],

	env: {
		es6: true,
	},

	parserOptions: {
		ecmaVersion: 2017,
	},

	plugins: [
		'import',
		'mocha',
		'react',
	],

	rules: {
		'import/unambiguous': ['off'],
	},

}
