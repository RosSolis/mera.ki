import React from 'react'

import fetch from 'isomorphic-fetch'
import Types from 'prop-types'

import {
	Alert,
	Badge,
	Form,
	FormGroup,
	InputGroup,
	InputGroupButton,
	Progress,
} from 'reactstrap'

const colors = Object.freeze(['danger', 'danger', 'warning', 'info', 'success'])
const strength = Object.freeze(['Awful', 'Low', 'Okay', 'Good', 'Great'])

const PasswordResult = ({ zxcvbn }) => {
	if (!zxcvbn) return null // renders nothing without response (this.props.zxcvbn)
	const durations = zxcvbn.crack_times_display
	const estimates = [
		{ actor: 'a novice', duration: durations.online_throttling_100_per_hour, rate: '100 attempts per hour' },
		{ actor: 'a professional', duration: durations.online_no_throttling_10_per_second, rate: '10 attempts per second' },
		{ actor: 'a corporation', duration: durations.offline_slow_hashing_1e4_per_second, rate: '1000 attempts per second' },
		{ actor: 'a state actor', duration: durations.offline_fast_hashing_1e10_per_second, rate: '10MM attempts per second' },
	]
	const feedback = [] // suggestions, warning, etc.
	const score = zxcvbn.score
	if (zxcvbn.feedback) {
		if (zxcvbn.feedback.suggestions) {
			const suggestions = zxcvbn.feedback.suggestions.map((suggestion, index) => (
				<li key={`feedback-suggestions-${index}`}>{suggestion}</li>
			))
			if (suggestions.length > 0) {
				feedback.push(
					<ul key='feedback-suggestions'>{suggestions}</ul>
				)
			}
		}
		if (zxcvbn.feedback.warning) {
			feedback.push(
				<Alert color={score ? 'warning' : 'danger'} key='feedback-warning'>
					{`Warning: ${zxcvbn.feedback.warning}`}
				</Alert>
			)
		}
		if (feedback.length > 0) {
			feedback.unshift(
				<p key='feedback-suggestions-header'>Consider this feedback, to improve your password(s):</p>
			)
		}
	}
	return (
		<div className='password-result'>
			<div>{feedback.length > 1 ? feedback : 'Nice password!'}</div>
			<span className='d-inline'>Strength: {strength[score]}</span>
			<Progress color={colors[score]} max={4} value={score || 4} />
			<p>Your password might be guessed:</p>
			<ul>
				{estimates.map(({ actor, duration, rate }, index) => (
					<li key={index}>by <Badge>{actor}</Badge> in <Badge>{duration}</Badge> at <Badge>{rate}</Badge></li>
				))}
			</ul>
		</div>
	)
}

PasswordResult.propTypes = {
	zxcvbn: Types.object,
}

class PasswordStrength extends React.Component {

	constructor (...args) {
		super(...args)
		this.state = {
			isLoading: false,
			lastError: null,
			zxcvbnResult: null,
		}
	}

	async submitPassword (password) {
		try {
			this.setState({ isLoading: true, zxcvbnResult: null })
			const response = await fetch('/auth/zxcvbn', {
				body: JSON.stringify({ password }),
				method: 'POST',
			})
			if (response.status !== 200) {
				throw new Error(response.status)
			}
			this.setState({
				zxcvbnResult: await response.json(),
			})
		} catch (error) {
			this.setState({ lastError: error })
		} finally {
			this.setState({ isLoading: false })
		}
	}

	submitForm (event) {
		this.submitPassword(this.password.value)
		this.password.value = ''
		event.preventDefault()
	}

	render () {
		const { isLoading, lastError, zxcvbnResult } = this.state
		const refPassword = (element) => (this.password = element)
		return (
			<div className='password-strength'>
				<Form className='m-3 p-3' onSubmit={(...args) => this.submitForm(...args)}>
					<FormGroup>
						<InputGroup>
							<InputGroupButton disabled={isLoading} type='submit'>Guess</InputGroupButton>
							<input
								autoFocus={true}
								className='form-control'
								disabled={isLoading}
								maxLength={100}
								placeholder='Password'
								ref={refPassword}
								type='password'
							/>
						</InputGroup>
					</FormGroup>
					<FormGroup>
						{lastError
							? (<Alert color='danger'>Sorry: technical difficulties. Please try again later.</Alert>)
							: (<PasswordResult zxcvbn={zxcvbnResult} />)
						}
					</FormGroup>
				</Form>
			</div>
		)
	}

}

export default PasswordStrength
