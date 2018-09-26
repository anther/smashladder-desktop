import React from "react";

export default (props) => {
	const percent = props.percent === undefined ? 100 : props.percent;
	const color = props.color || 'teal';
	return (
		<div className={`progress ${color} lighten-3`}>
			<div className={`determinate ${color}`} style={{width: `${percent}%`}}/>
		</div>
	);
}