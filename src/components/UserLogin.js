import React from 'react'

import Types from 'prop-types'

import {
	Alert,
	Badge,
	Form,
	FormGroup,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
} from 'reactstrap'

const CURRENT_USER_KEY = 'current.user'
const EMAIL_SUFFIX = '@meraki.net'
const LOCAL_STORAGE = localStorage

class UserLogin extends React.Component {

	constructor (props, ...args) {
		const user = props.currentUser
		const hasToken = user && user.token
		super(props, ...args)
		this.state = {
			isLoading: false,
			isModalOpen: !hasToken,
			lastError: null,
		}
	}

	handleSubmit (event) {
		const email = `${this.prefix.value}${EMAIL_SUFFIX}`
		this.obtainToken({ email }).then(() => window.location.reload())
		event.preventDefault()
	}

	async obtainToken ({ email }) {
		try {
			this.setState({ isLoading: true, lastError: null })
			UserLogin.currentUser({ email, token: 'fake' })
			this.setState({ isModalOpen: false })
		} catch (error) {
			this.setState({ lastError: error })
		} finally {
			this.setState({ isLoading: false })
		}
	}

	toggleModalOpen () {
		this.setState({
			isModalOpen: !this.state.isModalOpen,
		})
	}

	render () {
		const { isLoading, isModalOpen, lastError } = this.state
		const currentUserEmail = Object(this.props.currentUser).email || 'user'
		const currentUserEmailPrefix = currentUserEmail.replace(EMAIL_SUFFIX, '')
		const refEmailPrefix = (element) => (this.prefix = element)
		const alerts = []
		if (lastError) {
			alerts.push(
				<Alert color='danger'>Please try again later.</Alert>
			)
		}
		return (
			<Modal backdrop='static' isOpen={isModalOpen} keyboard={false} size='sm' toggle={() => this.toggleModalOpen()}>
				<Form onSubmit={event => this.handleSubmit(event)}>
					<ModalHeader>
						<span>Login <Badge>with Google</Badge></span>
					</ModalHeader>
					<ModalBody>
						{alerts}
						<FormGroup>
							<InputGroup>
								<input
									autoFocus={true}
									className='form-control text-right'
									disabled={isLoading}
									ref={refEmailPrefix}
									placeholder={currentUserEmailPrefix}
									required={true}
									type='text'
								/>
								<InputGroupAddon>{EMAIL_SUFFIX}</InputGroupAddon>
							</InputGroup>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<InputGroup>
							<InputGroupButton onClick={() => UserLogin.clear()}>Forget Me</InputGroupButton>
						</InputGroup>
						<input className='btn btn-info' disabled={isLoading} type='submit' value='Next' />
					</ModalFooter>
				</Form>
			</Modal>
		)
	}

	static currentUser (...args) {
		try {
			const object = Object(JSON.parse(LOCAL_STORAGE.getItem(CURRENT_USER_KEY)))
			const string = JSON.stringify(Object.assign(object, ...args))
			LOCAL_STORAGE.setItem(CURRENT_USER_KEY, string)
			return object
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error)
			return null
		}
	}

	static clear () {
		LOCAL_STORAGE.removeItem(CURRENT_USER_KEY)
		window.location.reload()
	}

	static login () {
		UserLogin.currentUser({ token: null })
		window.location.reload()
	}

	static logout () {
		UserLogin.currentUser({ token: null })
		window.location.reload()
	}

}

UserLogin.propTypes = {
	currentUser: Types.object.isRequired,
}

export default UserLogin
