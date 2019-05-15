import React, { PureComponent } from 'react';

export default class AlertBox extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			open: true
		};
		this.closeClick = this.closeClick.bind(this);
	}

	closeClick() {
		this.setState({
			open: false
		});
	}

	render() {
		const { children, onClose, success, ...props } = this.props;
		if (!this.state.open) {
			return null;
		}
		return (
			<div className={`row alert-box ${success ? 'success' : 'danger'}`} {...props}>
				<div className="col s12 m12">
					<div className="card ">
						<div className="row">
							<div className="col s12 m10">
								<div className="card-content">
									{children}
								</div>
							</div>
							<div className="col s12 m2">
								<i className="fa fa-times icon_style"
								   onClick={this.closeClick} id="alert_close"
								   aria-hidden="true"/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}