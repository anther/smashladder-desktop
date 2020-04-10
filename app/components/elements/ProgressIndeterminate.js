import React, { Component } from 'react';

export default class ProgressIndeterminate extends Component {
	static defaultProps = {
		showAnimation: true,
		color: 'teal'
	};

	render() {
		const { color, showAnimation, windowFocused } = this.props;
		const typeToShow = windowFocused && showAnimation ? 'indeterminate' : 'determinate';

		return (
			<div className={`progress ${color} lighten-3`}>
				<div className={`${typeToShow} ${color}`}/>
			</div>
		);
	}
}