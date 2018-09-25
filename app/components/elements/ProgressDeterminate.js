import React from "react";

export default (props) => {
	const percent = props.percent === undefined ? 100 : props.percent;
	return (
		<div className="progress">
			<div className="determinate" style={{width: `${percent}%`}}/>
		</div>
	);
}