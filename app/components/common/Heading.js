import React, {Component} from 'react';

export default class Heading extends Component {
	render(){
		return (
			<div id="main-heading">
				<h2 className="page-title">
					<span className="site_name">
						<span className="logo-smash">Smash</span> <img src="../images/ladder_logo_icon.png"/><span
						className="logo-ladder">Ladder</span>
					</span>
					<span className="launcher_name">
						<span className="logo-dolphin">Dolphin Launcher</span>
					</span>
				</h2>
			</div>
		)
	}
}
