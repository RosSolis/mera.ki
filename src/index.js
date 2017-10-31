import React from 'react'
import ReactDOM from 'react-dom'

import Root from './components/Root.js'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap-grid.css'
import 'bootstrap/dist/css/bootstrap-reboot.css'

import 'font-awesome/css/font-awesome.css'

import './styles/index.css'

if (typeof document === 'object') {
	const root = document.getElementById('root')
	if (root) ReactDOM.render(<Root />, root)
	// eslint-disable-next-line no-console
	else console.log('no element: #root')
}
