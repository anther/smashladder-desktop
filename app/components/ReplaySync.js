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
		this.state = {
			watching: null,
			sending: null,
			active: false,
			sentGame: null,
		}
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
		this.watcher.close();
	}

	getSyncStatusStatement(){
		if(this.state.sending)
		{
			return 'Sending Game Data...';
		}
		else if(this.slippiGame)
		{
			return 'Sending game result';
		}
		else
		{
			return 'Waiting';
		}
	}

	updateWatchSettings(settings){
		console.log('updating watch settings to ', settings);
		this.settings = settings;
		this.startWatchingIfSettingsAreGood();
		return this;
	}

	_getRootPath(){
		return this.props.replayPath;
	}

	startWatchingIfSettingsAreGood(){
		if(this.watcher)
		{
			this.watcher.close();
		}
		if(!this._getRootPath())
		{
			console.log('can not start watching since root path is not set');
			return;
		}
		if(!this.props.authentication)
		{
			console.log('Improper Authentation');
			return;
		}
		this.watcher = watch(this._getRootPath(), {recursive: false}, (event, filePath) => {
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


	render(){
		return (
			<div className='replays'>
				{this.props.replayPath &&
				<React.Fragment>
					<Button className='set_button'
					        onClick={this.onSetReplayDirectoryPath}>Replay Path Set
						{' '}<i className='fa fa-check'/>
					</Button>

					<div className='progress_status'>
						{!this.state.sending &&
							<ProgressDeterminate/>
						}
						{this.state.sending &&
							<ProgressIndeterminate />
						}
						<h6 className='connection_state'>
							{this.getSyncStatusStatement()}
						</h6>
					</div>
					{this.state.sentGame &&
					<h6 className='sent_game'>
						Match Submitted Successfully
					</h6>
					}
				</React.Fragment>
				}
				{!this.props.replayPath &&
				<Button className='error_button'
				        onClick={this.onSetReplayDirectoryPath}>Set Replay Path
				</Button>
				}
			</div>
		);
	}
}