import React from 'react'

import { CopyToClipboard } from 'react-copy-to-clipboard'
import FontAwesome from 'react-fontawesome'

import {
	Alert,
	Badge,
	InputGroup,
	InputGroupButton,
	Jumbotron,
	Form,
	FormGroup,
	FormText,
	TabContent,
	TabPane,
} from 'reactstrap'

class Root extends React.Component {

	constructor (...args) {
		super(...args)
		this.state = {
			isLoading: false,
			lastError: null,
			longURL: '',
			shortURL: '',
			textCopy: 'Copy',
		}
	}

	copyTimeout () {
		this.setState({ textCopy: 'Copied!' })
		setTimeout(() => this.setState({ textCopy: 'Copy' }), 1000)
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
	}

	resetForm (event) {
		this.long.value = ''
		this.short.value = ''
		this.setState({ longURL: '', shortURL: '' })
		event.preventDefault()
	}

	submitForm (event) {
		this.shortenLink(this.long.value)
		event.preventDefault()
	}

	render () {
		const { isLoading, lastError, longURL, shortURL, textCopy } = this.state
		return (
			<div>
				<Jumbotron>
					<Badge>
						<FontAwesome name='rocket' size='4x' />
					</Badge>
					<h1>mera.ki</h1>
				</Jumbotron>
				<TabContent activeTab='default'>
					<TabPane tabId='default'>
						<Form onSubmit={event => this.submitForm(event)}>
							<FormGroup>
								<Alert color='danger' isOpen={Boolean(lastError)} toggle={() => this.setState({ lastError: null })}>
									<FormText>Sorry, but that link could not be shortened.</FormText>
								</Alert>
							</FormGroup>
							<FormGroup>
								<InputGroup>
									{longURL
										? (<InputGroupButton disabled={isLoading} onClick={event => this.resetForm(event)}>Another!</InputGroupButton>)
										: (<InputGroupButton disabled={isLoading} type='submit'>Shorten</InputGroupButton>)
									}
									<input className='form-control' disabled={isLoading || longURL} placeholder='Long URL' ref={e => this.long = e} type='text' />
									<InputGroupButton disabled={!longURL} href={longURL} target='_blank'>Go</InputGroupButton>
								</InputGroup>
							</FormGroup>
							<FormGroup>
								<InputGroup>
									<CopyToClipboard onCopy={(...args) => this.copyTimeout(...args)} text={shortURL}>
										<InputGroupButton disabled={!shortURL}>{textCopy}</InputGroupButton>
									</CopyToClipboard>
									<input className='form-control' disabled={true} placeholder='Short URL' ref={e => this.short = e} type='text' value={shortURL} />
									<InputGroupButton disabled={!shortURL} href={shortURL} target='_blank'>Go</InputGroupButton>
								</InputGroup>
							</FormGroup>
						</Form>
					</TabPane>
				</TabContent>
			</div>
		)
	}

}

export default Root
