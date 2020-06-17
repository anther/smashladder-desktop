import React from 'react';

export default function InputSwitch({ disabledText = 'Disabled', enabledText = 'Enabled', ...props }) {
	return (
		<div className="switch">
			<label>
				<span>{disabledText}</span>
				<input
					type='checkbox'
					{...props}
				/>
				<span className="lever"/>
				<span>{enabledText}</span>
			</label>
		</div>
	);
}