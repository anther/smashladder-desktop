import React , {Component} from 'react';

export default class Button extends Component
{

	render(){
		let { className , ...props} = this.props;
		if(!className)
		{
			className = '';
		}
		className += ' btn waves-effect waves-light';
		return (
			<button type='button' className={className} {...props} />
		)
	}
}