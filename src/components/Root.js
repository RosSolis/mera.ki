import React from 'react'
import ReactFontAwesome from 'react-fontawesome'
import { Badge, Button, Jumbotron } from 'reactstrap'
import { MemoryRouter as Router } from 'react-router-dom'
import Types from 'prop-types'

import LinkShortening from './LinkShortening.js'
import PasswordStrength from './PasswordStrength.js'
import TabNavigation from './TabNavigation.js'
import UserLogin from './UserLogin.js'

const UserWelcome = ({ currentUser }) => (
	<Jumbotron className='m-3 p-3'>
		<h1><Badge>{currentUser.email}</Badge>, welcome!</h1>
		<span>Please click on one of the tabs above to get started.</span>
	</Jumbotron>
)

UserWelcome.propTypes = {
	currentUser: Types.object.isRequired,
}

const validUser = currentUser => currentUser && currentUser.token

const buildHead = currentUser => validUser(currentUser)
	? (
		<Button onClick={() => UserLogin.logout()}>Logout</Button>
	)
	: (
		<Button onClick={() => UserLogin.login()}>Login</Button>
	)

const buildBody = currentUser => validUser(currentUser)
	? (
		<TabNavigation tabs={{
			'Welcome': (<UserWelcome currentUser={currentUser} />),
			'Link Shortening': (<LinkShortening currentUser={currentUser} />),
			'Password Strength': (<PasswordStrength currentUser={currentUser} />),
		}} />
	)
	: (
		<UserLogin currentUser={currentUser} />
	)

const Root = () => {
	const currentUser = UserLogin.currentUser()
	return (
		<Router>
			<div className='root'>
				<Jumbotron className='text-center'>
					<Badge>
						<ReactFontAwesome name='rocket' size='4x' />
					</Badge>
					<h1>mera.ki</h1>
					<div className='container'>
						{buildHead(currentUser)}
					</div>
				</Jumbotron>
				<div className='container-fluid'>
					{buildBody(currentUser)}
				</div>
			</div>
		</Router>
	)
}

export default Root
