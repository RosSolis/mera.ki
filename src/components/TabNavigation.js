import React from 'react'

import classNames from 'classnames'
import Types from 'prop-types'

import { Link, Route } from 'react-router-dom'

import {
	Nav,
	NavItem,
	TabContent,
	TabPane,
} from 'reactstrap'

const routerPath = index => index ? `/tab/${index}` : '/'

class TabNavigation extends React.Component {

	constructor (...args) {
		super(...args)
		this.state = {
			activeTab: 0,
		}
	}

	activeTab (activeTab) {
		if (this.state.activeTab !== activeTab) {
			this.setState({ activeTab })
		}
	}

	render () {
		const activeTab = this.state.activeTab
		const tabs = this.props.tabs
		return (
			<div className='tab-navigation'>
				<Nav tabs>
					{Object.keys(tabs).map((key, index) => {
						const className = classNames({ active: activeTab === index, 'nav-link': true })
						return (
							<NavItem key={index}>
								<Link className={className} onClick={() => this.activeTab(index)} to={routerPath(index)}>{key}</Link>
							</NavItem>
						)
					})}
				</Nav>
				<TabContent activeTab={this.state.activeTab}>
					{Object.keys(tabs).map((key, index) => (
						<TabPane key={index} tabId={index}>
							<Route exact path={routerPath(index)} render={() => tabs[key]} />
						</TabPane>
					))}
				</TabContent>
			</div>
		)
	}

}

TabNavigation.propTypes = {
	tabs: Types.object.isRequired,
}

export default TabNavigation
