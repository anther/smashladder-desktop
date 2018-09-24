import React, {Component} from 'react';
import {ReplaySync} from "../ReplaySync";

export default class Layout extends React.Component {
	render(){
		return (
			<div className='container'>
				<div id="main-heading">
					<h2 className="page-title">
					<span className='site_name'>
						<span className='logo-smash'>Smash</span>
						<img src='./images/ladder_logo_icon.png'/>
						<span className='logo-ladder'>Ladder</span>
					</span>
								<span className='launcher_name'>
						<span className='logo-dolphin'>Dolphin Launcher</span>
					</span>
					</h2>
				</div>
				<span
					className='title_tip'>Automatically launches dolphin when you join a match on smashladder.com</span>
				{this.props.authentication &&
				<ReplaySync
					replayPath={this.props.replayPath}
					setReplayPath={this.props.setReplayPath}
				/>
				}
				<div className='row'>
					<div className='col l8'>
						{this.props.children}
					</div>
					<div className='col l4'>
						Rawr
					</div>
				</div>
			</div>
		)
	}

}