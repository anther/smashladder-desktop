import React, { Component } from 'react';

export default class Select extends Component {

	render() {
		let { className, ...props } = this.props;
		if (!className) {
			className = '';
		}
		className += ' browser-default';
		return (
			<select className={className} {...props} />
		);
	}
}