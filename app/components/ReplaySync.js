import React, {Component} from 'react';
import {Files} from "../utils/Files";
import Button from "./elements/Button";
import {endpoints} from "../utils/SmashLadderAuthentication";
import watch from "node-watch";
import fs from "fs";
import path from "path";
import Numbers from "../utils/Numbers";
import multitry from "../utils/multitry";
import SlippiGame from "slp-parser-js";
import ProgressDeterminate from "./elements/ProgressDeterminate";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

export class ReplaySync extends Component {
	constructor(props){
		super(props);
		this.onSetCheckForReplaysTrue = this.updateCheckForReplays.bind(this, true);
		this.onSetCheckForReplaysFalse = this.updateCheckForReplays.bind(this, false);
		this.watcher = null;
		this.watchingPaths = [];
		this.state = {
			watching: null,
			sending: null,
			active: false,
			sentGame: null,
			checkForReplays: null,
		}
	}

	updateCheckForReplays(set){
		this.props.setCheckForReplays(set);
	}

	static getDerivedStateFromProps(props, state){
		if(props.checkForReplays !== state.checkForReplays)
		{
			return {
				checkForReplays: props.checkForReplays
			};
		}
		return null;
	}

	componentDidMount(){
		this.startWatchingIfSettingsAreGood();
	}

	componentDidUpdate(){
		this.startWatchingIfSettingsAreGood();
	}

	componentWillUnmount(){
		this.disableWatch();
	}

	disableWatch(){
		if(this.watcher)
		{
			this.watcherPath = null;
			this.watcher.close();
			this.watcher = null;
		}
	}

	_getWatchableSlippiPaths(){
		const { builds } = this.props;
		let paths = new Set();
		_.each(builds, (build) =>{
			if(build.getSlippiPath())
			{
				paths.add(build.getSlippiPath());
			}
		});
		paths = Array.from(paths);
		return paths;
	}

	startWatchingIfSettingsAreGood(){
		const { authentication, connectionEnabled } = this.props;
		const { checkForReplays } = this.state;
		if(!connectionEnabled)
		{
			return;
		}
		if(!checkForReplays)
		{
			this.disableWatch();
			return;
		}
		if(!authentication)
		{
			this.disableWatch();
			return;
		}
		const paths = this._getWatchableSlippiPaths();

		if(!_.isEqual(this.watchingPaths.sort(), paths.sort()))
		{
			this.watchingPaths = paths;
			console.log('gon watch', paths);
			this.watcher = watch(paths, {recursive: false}, (event, filePath) => {
				if(event == 'remove')
				{
					return;
				}
				fs.lstat(filePath, (err, stats) => {
					if(err)
					{
						return console.log(err); //Handle error
					}
					else
					{
						if(stats.isFile())
						{
							this.slippiGame = null;
							this.updateLastGame(filePath);
						}
					}
				});
			});
		}
	}

	updateLastGame(file){
		if(file && !this.slippiGame)
		{
			this.setState({watching: file});
			this.loadGame(file).then(gameData => {
				this.setState({
					watching: null,
					sending: true,
				});

				const game = {
					metadata: gameData.metadata,
					stats: gameData.stats,
					settings: gameData.settings,
				};
				const sendData = {
					game: JSON.stringify(game),
					source: 'slippiLauncher',
				};

				console.log('sending', sendData);
				this.props.authentication.apiPost(endpoints.SUBMIT_REPLAY_RESULT, sendData)
					.then((response) => {
						console.log('response', response);
						this.setState({
							sending: false,
							sentGame: gameData
						});
						console.log(gameData);
						if(response.other_players)
						{
							this.createBetterFileName(file, {
								others: response.other_players,
							})
						}
						else
						{
						}
					})
					.catch((response) => {
						console.error('response failed', response);
						this.setState({sending: false});
					})
			}).catch(error => {
				console.error(error);
			})

		}

	}

	createBetterFileName(originalFile, {others = []}){
		const date = new Date();
		const root = path.dirname(originalFile);

		const folder = `${root}/${date.getFullYear()}-${Numbers.forceTwoDigits(date.getMonth())}-${Numbers.forceTwoDigits(date.getDate())}`;
		const hour = Numbers.forceTwoDigits(date.getHours());
		let usernameList = '';
		if(others.length)
		{
			usernameList = others.map((other) => other.username.replace(/[^a-z0-9]/gi, '_')).join('-');
			usernameList = `_with-${usernameList}`;
		}
		else
		{
			usernameList = '';
		}
		const fileName = `${hour}${Numbers.forceTwoDigits(date.getMinutes())}${usernameList}.slp`;
		const newName = `${folder}/${fileName}`;

		Files.ensureDirectoryExists(folder, 0o755, (error) => {
			if(!error)
			{
				fs.rename(originalFile, newName, (error) => {
					if(error)
					{
						throw error;
					}
				});
			}
		})
	}

	loadGame(file){
		return multitry(500, 5, () => {
			const data = {};
			data.game = new SlippiGame(file);
			data.settings = data.game.getSettings();
			data.metadata = data.game.getMetadata();
			data.stats = data.game.getStats();
			if(!data.settings || data.settings.stageId === 0)
			{
				throw new Error('Invalid data');
			}
			return data;
		});
	}


	isReady(){
		const { connectionEnabled } = this.props;
		const { sending } = this.state;

		return !sending;
	}

	getProgressColor(){
		const { connectionEnabled, checkForReplays } = this.props;
		return connectionEnabled && checkForReplays ? 'teal' : 'red';
	}

	getSyncStatusStatement(){
		const { authentication, connectionEnabled } = this.props;
		const { sending, checkForReplays } = this.state;

		if(!authentication)
		{
			return 'Invalid Authentication';
		}
		if(sending)
		{
			return 'Sending Game Data...';
		}
		if(this.slippiGame)
		{
			return 'Sending game result';
		}
		if(!connectionEnabled)
		{
			return 'Connection Disabled';
		}
		if(!checkForReplays)
		{
			return '...Not Enabled...';
		}
		return 'Waiting';
	}

	render(){
		const { checkForReplays } = this.props;
		return (
			<div className='replays'>
				{checkForReplays &&
					<Button
						className='set_button'
						onClick={this.onSetCheckForReplaysFalse}>Send Replays ✔
					</Button>
				}
				{!checkForReplays &&
					<Button className='error_button'
				        onClick={this.onSetCheckForReplaysTrue}>No Replays ❌
					</Button>
				}

				<div className='progress_status'>
					{this.isReady() &&
						<ProgressDeterminate
							color={this.getProgressColor()}
						/>
					}
					{!this.isReady() &&
						<ProgressIndeterminate
							color={this.getProgressColor()}
						/>
					}
					<h6 className='connection_state'>
						{this.getSyncStatusStatement()}
					</h6>
					<span className='what_am_i'>
						Compatible only with Project Slippi.  Your replay directory will be watched for new files and will automatically send the results to SmashLadder.
					</span>
				</div>
				{this.state.sentGame &&
				<h6 className='sent_game'>
					Match Submitted Successfully
				</h6>
				}
			</div>
		);
	}
}