import React, {Component} from 'react';
import {ReplaySync} from "../ReplaySync";
import {WebsocketComponent} from "../WebsocketComponent";
import Button from "../elements/Button";

import ladder_logo_icon from '../../images/ladder_logo_icon.png';
import FilePaths from "../FilePaths";

export default class Layout extends Component {
	render(){
		return (
			<div className='container'>
				<div id="main-heading">
					{this.props.player &&
						<div className='login_information'>
							<span className='logged_in_as'>
								<span className='fluff'>Logged In As{' '}</span>
								<span className='username'>{this.props.player.username}</span>
							</span>
							<span className='logout'>
								<a className='waves-effect waves-teal btn-flat'
								   onClick={this.props.logout}>Log Out
								</a>
							</span>
						</div>
					}
					<h3 className="page-title">
						<span className='site_name'>
							<span className='logo-smash'>Smash</span>
							<img src={ladder_logo_icon}/>
							<span className='logo-ladder'>Ladder</span>
						</span>
							<span className='launcher_name'>
							<span className='logo-dolphin'>Dolphin Launcher</span>
						</span>
					</h3>
				</div>
				<div className='row'>
					<div className={this.props.authentication ? 'col m8' : ''}>
						{this.props.children}
					</div>
					{this.props.authentication &&
					<div className='col m4 connecties'>
						<WebsocketComponent
							authentication={this.props.authentication}

							builds={this.props.builds}
							launchBuild={this.props.launchBuild}
							hostBuild={this.props.hostBuild}
							joinBuild={this.props.joinBuild}
							startGame={this.props.startGame}
							closeDolphin={this.props.closeDolphin}
						/>
						<ReplaySync
							authentication={this.props.authentication}
							replayPath={this.props.replayPath}
							setReplayPath={this.props.setReplayPath}
						/>
						<FilePaths
							romPath={this.props.romPath}
							searchSubdirectories={this.props.searchSubdirectories}
							updateRomPath={this.props.updateRomPath}
							updateSearchSubdirectories={this.props.updateSearchSubdirectories}
						/>
					</div>
					}
				</div>
			</div>
		)
	}

}