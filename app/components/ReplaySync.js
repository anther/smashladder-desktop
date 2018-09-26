import React, {Component} from 'react';
import {Files} from "../utils/Files";
import Button from "./elements/Button";
import {endpoints} from "../utils/SmashLadderAuthentication";
import watch from "node-watch";
import fs from "fs";
import Numbers from "../utils/Numbers";
import multitry from "../utils/multitry";
import SlippiGame from "slp-parser-js";
import ProgressDeterminate from "./elements/ProgressDeterminate";
import ProgressIndeterminate from "./elements/ProgressIndeterminate";

export class ReplaySync extends Component {
	constructor(props){
		super(props);
		this.onSetReplayDirectoryPath = this.setReplayDirectoryPath.bind(this);
		this.watcher = null;
		this.watcherPath = null;
		this.state = {
			watching: null,
			sending: null,
			active: false,
			sentGame: null,
			replayPath: null,
		}
	}

	static getDerivedStateFromProps(props, state){
		if(props.replayPath !== state.replayPath)
		{
			return {
				replayPath: props.replayPath
			};
		}
		return null;
	}

	setReplayDirectoryPath(){
		Files.selectDirectory(this.props.replayPath).then((path) => {
			if(path)
			{
				this.props.setReplayPath(path);
			}
		})
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

	_getRootPath(){
		return this.props.replayPath;
	}

	startWatchingIfSettingsAreGood(){
		const { authentication, connectionEnabled } = this.props;
		const { replayPath } = this.state;
		if(!connectionEnabled)
		{
			return;
		}
		if(!replayPath)
		{
			this.disableWatch();
			return;
		}
		if(!authentication)
		{
			this.disableWatch();
			return;
		}
		if(this.watcherPath !== replayPath)
		{
			this.watcherPath = replayPath;
			this.watcher = watch(replayPath, {recursive: false}, (event, filePath) => {
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
		const folder = `${this._getRootPath()}/${date.getFullYear()}-${Numbers.forceTwoDigits(date.getMonth())}-${Numbers.forceTwoDigits(date.getDate())}`;
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
		const { connectionEnabled, replayPath } = this.props;
		return connectionEnabled && replayPath ? 'teal' : 'red';
	}

	getSyncStatusStatement(){
		const { authentication, connectionEnabled } = this.props;
		const { sending, replayPath } = this.state;

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
			return 'Watch Process Disabled';
		}
		if(!replayPath)
		{
			return 'Path Not Set';
		}
		return 'Waiting';
	}

	render(){
		const {replayPath } = this.props;
		return (
			<div className='replays'>
				{replayPath &&
					<Button
						title={replayPath}
						className='set_button'
						onClick={this.onSetReplayDirectoryPath}>Replay Path Set ✔
					</Button>
				}
				{!replayPath &&
					<Button className='error_button'
				        onClick={this.onSetReplayDirectoryPath}> Set Replay Path ❌
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