/* eslint-disable jsx-a11y/click-events-have-key-events */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import ladderLogoIcon from '../../images/ladder_logo_icon.png';


export default class Header extends Component {
	static propTypes = {
		player: PropTypes.object,
		productionUrls: PropTypes.bool,
		enableDevelopmentUrls: PropTypes.func,
		enableProductionUrls: PropTypes.func,
		logout: PropTypes.func
	};

	static defaultProps = {
		player: null,
		productionUrls: null,
		enableDevelopmentUrls: null,
		enableProductionUrls: null,
		logout: null
	};

	constructor(props) {
		super(props);

		this.logoTimeout = null;
		this.logoClick = this.logoClick.bind(this);

		this.setState({
			logoClicks: 0
		});
	}

	logoClick() {
		clearTimeout(this.logoTimeout);
		this.setState((prevState) => {
			return {
				logoClicks: prevState.logoClicks + 1
			};
		});
		this.logoTimeout = this.setTimeout(() => {
			this.setState({
				logoClicks: 0
			});
		}, 4000);
	}

	render() {
		const { player, logout, productionUrls, enableDevelopmentUrls, enableProductionUrls } = this.props;
		return (
			<div id="main-heading">
				{player &&
				<div className='login_information'>
					<span className='logged_in_as'>
						<span className='fluff'>Logged in as{' '}</span>
						<span className='username'>{player.username}</span>
					</span>
					<span className='logout'>
						<a className='waves-effect waves-teal btn-flat btn-small'
						   onClick={logout}>Log Out
						</a>
					</span>
					{player.id === 1 &&
					<React.Fragment>
						{productionUrls !== false &&
						<a className='waves-effect waves-teal btn-flat btn-small'
						   onClick={enableDevelopmentUrls}>Production Urls
						</a>
						}

						{productionUrls === false &&
						<a className='waves-effect waves-teal btn-flat btn-small'
						   onClick={enableProductionUrls}>Developer Urls
						</a>
						}
					</React.Fragment>
					}
				</div>
				}
				<h3 className="page-title">
					<span className='site_name'>
						<span className='logo-smash'>Smash</span>
						<img
							onClick={this.logoClick}
							alt='' src={ladderLogoIcon}/>
						<span className='logo-ladder'>Ladder</span>
					</span>
					<span className='launcher_name'>
						<span className='logo-dolphin'>Dolphin Launcher <span
							className='beta'>Beta {remote.app.getVersion()}</span> </span>
					</span>
				</h3>
			</div>
		);
	}
}