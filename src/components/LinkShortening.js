import React from 'react'

import {
	Alert,
	Form,
	FormGroup,
	InputGroup,
	InputGroupButton,
} from 'reactstrap'

import { CopyToClipboard } from 'react-copy-to-clipboard'

class LinkShortening extends React.Component {

	constructor (...args) {
		super(...args)
		this.state = {
			copyButtonText: 'Copy!',
			isLoading: false,
			lastError: null,
			longURL: '',
			shortURL: '',
		}
	}

	copyTimeout () {
		this.setState({ copyButtonText: 'Copied!' }) // and after one second:
		setTimeout(() => this.setState({ copyButtonText: 'Copy' }), 1000)
	}

	async shortenLink (longURL) {
		try {
			this.setState({ isLoading: true, lastError: null, longURL: '', shortURL: '' })
			const response = await fetch('/api/link', { body: longURL, method: 'POST' })
			if (response.status !== 201) throw new Error(response.status)
			this.setState({ longURL, shortURL: await response.text() })
		} catch (error) {
			this.setState({ lastError: error })
		} finally {
			this.setState({ isLoading: false })
		}
		return this.state.shortURL
	}

	resetLink (event) {
		event.preventDefault()
		this.setState({
			copyButtonText: 'Copy!',
			longURL: (this.long.value = ''),
			shortURL: (this.short.value = ''),
		})
	}

	submitLink (event) {
		event.preventDefault()
		this.shortenLink(this.long.value)
			.then((shortURL) => (this.short.value = shortURL))
	}

	render () {
		const refLong = (element) => (this.long = element)
		const refShort = (element) => (this.short = element)
		const { copyButtonText, isLoading, lastError, longURL, shortURL } = this.state
		return (
			<div className='link-shortening'>
				<Form className='m-3 p-3' onSubmit={event => this.submitLink(event)}>
					<FormGroup>
						<InputGroup>
							{longURL
								? (<InputGroupButton disabled={isLoading} onClick={event => this.resetLink(event)}>Another!</InputGroupButton>)
								: (<InputGroupButton disabled={isLoading} type='submit'>Shorten</InputGroupButton>)
							}
							<input
								autoFocus={true}
								className='form-control'
								disabled={isLoading || longURL}
								maxLength={2048}
								placeholder='Long URL'
								ref={refLong}
								type='text'
							/>
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<InputGroup>
							<CopyToClipboard onCopy={(...args) => this.copyTimeout(...args)} text={shortURL}>
								<InputGroupButton disabled={!shortURL}>{copyButtonText}</InputGroupButton>
							</CopyToClipboard>
							<input className='form-control' disabled={true} placeholder='Short URL' ref={refShort} type='text' />
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<Alert color='danger' isOpen={Boolean(lastError)} toggle={() => this.setState({ lastError: null })}>
							Sorry: that link could not be shortened. Make sure your URL is valid.
						</Alert>
					</FormGroup>
				</Form>
			</div>
		)
	}

}

export default LinkShortening
