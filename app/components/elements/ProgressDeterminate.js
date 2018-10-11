import React from 'react';

export default (props) => {
	const percent = props.percent === undefined ? 100 : props.percent;
	const color = props.color || 'teal';
	return (
		<div className={`progress ${color} lighten-4`}>
			<div className={`determinate ${color} lighten-2`} style={{ width: `${percent}%` }}/>
		</div>
	);
}