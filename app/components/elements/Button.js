import React , {Component} from 'react';

export default class Button extends React.Component
{

	render(){
		let { className , ...props} = this.props;
		if(!className)
		{
			className = '';
		}
		className += ' btn waves-effect waves-light';
		return (
			<button className={className} {...props} />
		)
	}
}