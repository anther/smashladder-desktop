import React , { Component } from 'react';
import Button from "./elements/Button";

export default class AutoUpdates extends Component{
	render(){
		return null;
		return (
			<div className='auto_updates'>
				{!this.props.checkingForUpdates && this.props.updateAvailable === null &&
				<Button className='btn-small'
				   onClick={this.props.initializeAutoUpdater}>Check for updates
				</Button>
				}
				{this.props.checkingForUpdates &&
					<span>Checking For Updates...</span>
				}
				{this.props.updateAvailable &&
					<Button className='btn-small'
				        onClick={this.props.startAutoUpdate}>Download And Install Update
					</Button>
				}
				{this.props.downloadingUpdate &&
					<h5>Update is Downloading</h5>
				}
				{this.props.updateDownloaded &&
					<h5>Update Downloaded! The Application will now restart</h5>
				}
			</div>
		)
	}
}