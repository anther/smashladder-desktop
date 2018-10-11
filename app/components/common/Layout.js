import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Layout extends Component {
	static propTypes = {
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node
		]).isRequired
	};

	render() {
		const { children } = this.props;
		const elements = children.slice();
		const heading = elements.shift();
		const mainContent = elements.slice(0, 1);
		return (
			<div className="container">
				{heading}
				<div className="row">
					{mainContent}
				</div>
			</div>
		);
	}
}
