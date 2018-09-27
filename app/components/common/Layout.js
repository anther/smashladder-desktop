import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Layout extends Component {
	static propTypes = {
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]).isRequired
	}

	render(){
		const { children } = this.props;
		const elements = children.slice();
		const heading = elements.shift();
		const mainContent = elements.slice(0,1);
		const sideContent = elements.slice(1);
		return (
			<div className='container'>
				{heading}
				<div className='row'>
					<div className={mainContent.length > 0 ? 'col m8' : ''}>
						{mainContent}
					</div>
					<div className='col m4 connecties'>
						{sideContent}
					</div>
				</div>
			</div>
		)
	}

}