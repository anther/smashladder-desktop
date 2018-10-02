import React, { Component } from 'react';
import Button from "./elements/Button";
import LoaderFlashing from "./elements/LoaderFlashing";
import { activeUpdateStates } from "../reducers/autoUpdates";

export default class AutoUpdates extends Component {
	render(){
		const {
			checkingForUpdates,
			updateAvailable,
			activeUpdate,
			initializeAutoUpdater,
			startAutoUpdate,
		} = this.props;

		return (
			<div className='auto_updates'>
				{false && !checkingForUpdates && updateAvailable === null &&
				<Button className='btn-small'
				        onClick={initializeAutoUpdater}>Check for updates
				</Button>
				}
				{false && checkingForUpdates &&
				<span>Checking For Updates...</span>
				}
				{updateAvailable &&
				<Button className='btn-small'
				        onClick={startAutoUpdate}>Download And Install Update
				</Button>
				}
				{activeUpdate === activeUpdateStates.DOWNLOADING &&
					<React.Fragment>
						<h5>An Update is Downloading</h5>
						<LoaderFlashing/>
					</React.Fragment>
				}
				{activeUpdate === activeUpdateStates.DOWNLOADED &&
					<h5>Update Downloaded! The Application will now restart</h5>
				}
			</div>
		)
	}
}