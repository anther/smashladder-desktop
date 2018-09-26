import React from "react";

export default (props)=> {
	const color = props.color || 'teal';
	return (
		<div className={`progress ${color} lighten-3`}>
			<div className={`indeterminate ${color}`}/>
		</div>
	);
};