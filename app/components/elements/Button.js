import React, { Component } from 'react';
import HtmlClassList from '../../utils/HtmlClassList';

export default class Button extends Component {

	render() {
		let { className, small, ...props } = this.props;
		const classes = new HtmlClassList(className);
		classes.add('btn waves-effect waves-light');
		if(small){
			classes.add('btn-small');
		}
		return (
			<button type='button' className={classes.toString()} {...props} />
		);
	}
}