/* eslint-env node */

// eslint-disable-next-line no-console
console.log(`

	For development, in separate terminals:

	* npm run server # default PORT=8080
	* npm run client # default PORT=3000

	For production, run these commands:
	
	* # To generate a production bundle:
	* npm run bundle # public + src
	* rm -r -f -v served/mvp
	* mv build served/mvp

	See package.json for details.

`)

process.exitCode = 1
