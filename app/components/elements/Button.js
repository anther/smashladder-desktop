import React, { Component } from 'react';
import HtmlClassList from '../../utils/HtmlClassList';

export default class Button extends Component {
	static defaultProps = {
		darkWaves: true
	};

	render() {
		let { className, small, darkWaves, ...props } = this.props;
		const classes = new HtmlClassList(className);
		classes.add('btn waves-effect');
		classes.add(darkWaves ? 'waves-dark' : 'waves-light');

		if (small) {
			classes.add('btn-small');
		}
		return (
			<button type='button' className={classes.toString()} {...props} />
		);
	}
}