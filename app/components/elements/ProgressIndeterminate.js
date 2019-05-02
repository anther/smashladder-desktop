import React, { Component } from 'react';

export default class ProgressIndeterminate extends Component {

	render() {
		const props = this.props;
		const color = props.color || 'teal';
		const typeToShow = props.windowFocused ? 'indeterminate' : 'determinate';
		return (
			<div className={`progress ${color} lighten-3`}>
				<div className={`${typeToShow} ${color}`}/>
			</div>
		);
	}
}