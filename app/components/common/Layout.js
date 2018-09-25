import React, {Component} from 'react';
import {ReplaySync} from "../ReplaySync";
import {WebsocketComponent} from "../WebsocketComponent";

export default class Layout extends Component {
	render(){
		return (
			<div className='container'>
				<div id="main-heading">
					<h3 className="page-title">
					<span className='site_name'>
						<span className='logo-smash'>Smash</span>
						<img src='./images/ladder_logo_icon.png'/>
						<span className='logo-ladder'>Ladder</span>
					</span>
								<span className='launcher_name'>
						<span className='logo-dolphin'>Dolphin Launcher</span>
					</span>
					</h3>
				</div>
				<div className='row'>
					<div className='col m8'>
						{this.props.children}
					</div>
					<div className='col m4 connecties'>
						<ReplaySync
							authentication={this.props.authentication}
							replayPath={this.props.replayPath}
							setReplayPath={this.props.setReplayPath}
						/>
						<WebsocketComponent
							authentication={this.props.authentication}

							launchBuild={this.props.launchBuild}
							hostBuild={this.props.hostBuild}
							joinBuild={this.props.joinBuild}
							closeDolphin={this.props.closeDolphin}
						/>
					</div>
				</div>
			</div>
		)
	}

}