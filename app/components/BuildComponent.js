import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { remote, shell } from 'electron';
import path from 'path';
import _ from 'lodash';
import unzipper from 'unzipper';
import Build from '../utils/BuildData';
import Files from '../utils/Files';

import multitry from '../utils/multitry';

import Button from './elements/Button';
import Select from './elements/Select';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import ProgressDeterminate from './elements/ProgressDeterminate';
import RemoveBuildPathsButton from './elements/RemoveBuildPathsButton';
import SetBuildPathButton from './elements/SetBuildPathButton';

const fs = require('fs');
const request = require('request');
const progress = require('request-progress');

export default class BuildComponent extends Component {
	static propTypes = {
		build: PropTypes.instanceOf(Build).isRequired,
		setBuildPath: PropTypes.func.isRequired,
		closeDolphin: PropTypes.func.isRequired,
		joinBuild: PropTypes.func.isRequired,
		launchBuild: PropTypes.func.isRequired,
		hostBuild: PropTypes.func.isRequired,
		setDefaultPreferableNewUserBuildOptions: PropTypes.func.isRequired,
		startGame: PropTypes.func.isRequired,
		buildOpen: PropTypes.bool.isRequired,
		buildOpening: PropTypes.bool.isRequired,
		buildError: PropTypes.any,
		hostCode: PropTypes.string.isRequired,
		dolphinInstallPath: PropTypes.string.isRequired
	};

	static defaultProps = {
		buildError: null
	};

	constructor(props) {
		super(props);
		const { build } = this.props;

		const selectedGame = build.getPrimaryGame();

		this.state = {
			error: null,
			selectedGame: selectedGame ? selectedGame.id : null,
			joinCode: '',
			enterJoinCode: false,
			submittingJoinCode: false,

			downloading: null,
			downloadingProgress: null,
			downloadError: null,
			glowing: true,
			unsettingBuildPathView: false,
			transitioning: false
		};

		this.glowTimeout = null;

		this.onHostClick = this.hostClick.bind(this);
		this.onCloseClick = this.closeClick.bind(this);
		this.onJoinClick = this.joinClick.bind(this);
		this.onLaunchClick = this.launchClick.bind(this);
		this.onStartGameClick = this.startGameClick.bind(this);

		this.joinCodeCancel = this.joinCodeCancel.bind(this);
		this.joinCodeChange = this.joinCodeChange.bind(this);
		this.joinCodeSubmit = this.joinCodeSubmit.bind(this);
		this.onDownloadClick = this.downloadClick.bind(this);

		this.onBuildNameClick = this.buildNameClick.bind(this);
		this.beginUnsettingBuildPath = this.beginUnsettingBuildPath.bind(this);
		this.cancelUnsettingBuildPath = this.cancelUnsettingBuildPath.bind(this);
		this.confirmUnsetBuildPath = this.confirmUnsetBuildPath.bind(this);


		this.onSelectedGameChange = this.selectedGameChange.bind(this);
		this.slippiIconRef = React.createRef();
	}

	componentDidMount() {
		this.glowTimeout = setTimeout(() => {
			this.setState({
				glowing: false
			});
		}, 10000);
	}

	componentWillUnmount() {
		clearTimeout(this.glowTimeout);
	}

	buildNameClick() {
		shell.showItemInFolder(this.props.build.executablePath());
	}

	cancelUnsettingBuildPath() {
		this.setState({
			unsettingBuildPathView: false
		});
	}

	beginUnsettingBuildPath() {
		this.setState({
			unsettingBuildPathView: true
		});
	}

	confirmUnsetBuildPath() {
		const { setBuildPath, build } = this.props;
		this.setState({
			transitioning: true
		});
		setTimeout(() => {
			this.setState({
				unsettingBuildPathView: false
			});
			setBuildPath(build, null);
			setTimeout(() => {
				this.setState({
					transitioning: false
				});
			}, 1000);
		}, 1000);
	}

	downloadClick() {
		this.setState({
			downloading: 'Downloading...',
			downloadError: null,
			error: null
		});

		const { build, dolphinInstallPath } = this.props;

		const basePath = path.join(dolphinInstallPath);
		console.log('downloading from', build.download_file);

		const baseName = `${Files.makeFilenameSafe(build.name + build.id)}`;
		const extension = path.extname(build.download_file);
		const baseNameAndExtension = `${baseName}${extension}`;
		const unzipLocation = path.join(basePath, baseName, '/');
		const zipWriteLocation = path.join(basePath, baseNameAndExtension);

		Files.ensureDirectoryExists(basePath, 0o0755)
			.then(() => {
				this.setState({
					downloading: build.download_file
				});
				return progress(request(build.download_file), {})
					.on('progress', (state) => {
						this.setState({
							downloadingProgress: state.percent
						});
						console.log('progress', state);
					})
					.on('error', (err) => {
						console.error(err);
						this.setState({
							downloadError: err,
							downloading: null
						});
					})
					.once('finish', () => {
						console.log('finished!');
					})
					.on('end', () => {
						console.log('ended!');
						const stats = fs.statSync(zipWriteLocation);
						if (stats.size <= 30) {
							this.setState({
								error: 'File was not found... Probably',
								downloading: null
							});
							return;
						}


						// Do something after request finishes
						this.setState({
							downloading: 'Unzipping Build',
							downloadingProgress: null
						});

						const updateUnzipDisplay = _.throttle((entry) => {
							this.setState({
								unzipStatus: entry.path ? entry.path : null
							});
						}, 100);
						switch (extension.toLowerCase()) {
							case '.zip':
								console.log('Before open zip', zipWriteLocation);
								multitry(500, 5, () => {
									fs.createReadStream(zipWriteLocation).pipe(
										unzipper
											.Extract({ path: unzipLocation })
											.on('close', () => {
												console.log('cllosed?');
												const dolphinLocation = Files.findInDirectory(unzipLocation, 'Dolphin.exe');
												console.log(dolphinLocation, 'what is dolphin lcoation');
												if (dolphinLocation.length) {
													this.props.setBuildPath(build, dolphinLocation[0], true);
													this.props.setDefaultPreferableNewUserBuildOptions(build);
												} else {
													this.setState({
														error: 'Could not find Dolphin.exe after extracting the archive'
													});
												}
												this.setState({
													downloading: null,
													unzipStatus: null
												});
											})
											.on('entry', updateUnzipDisplay)
											.on('error', (error) => {
												console.error(error);
												this.setState({
													downloading: null,
													unzipStatus: null,
													error: error.toString()
												});
											})
									);
								}).catch((error) => {
									console.log('unzip fail multiple times...');
									console.error(error);
								});

								break;
							default:
								this.setState({
									unzipStatus: null,
									downloading: null,
									error: 'Could not extract archive! (Invalid Extension)'
								});
						}
					})
					.pipe(fs.createWriteStream(zipWriteLocation));
			})
			.catch((error) => {
				this.setState({
					error: error ? error.toString() : 'Error Downloading File...'
				});
			});
	}

	joinCodeCancel() {
		this.setState({
			enterJoinCode: false,
			joinCode: ''
		});
	}

	joinCodeChange(event) {
		this.setState({
			joinCode: event.target.value
		});
	}

	joinClick() {
		this.setState({
			enterJoinCode: true,
			joinCode: '',
			submittingJoinCode: false
		});
	}

	selectedGameChange(event) {
		this.setState({
			selectedGame: event.target.value
		});
	}

	closeClick() {
		return this.props.closeDolphin();
	}

	_getSelectedGame() {
		const game = this.props.build.getPossibleGames().find((searchGame) => {
			return searchGame.id === this.state.selectedGame;
		});
		if (!game) {
			this.setState({
				error: 'Somehow No Game is Selected'
			});
			return null;
		}
		return game;
	}

	joinCodeSubmit() {
		this.setState({
			enterJoinCode: false,
			submittingJoinCode: true
		});
		this.props.joinBuild(this.props.build, this.state.joinCode);
	}

	launchClick() {
		return this.props.launchBuild(this.props.build);
	}

	hostClick() {
		this.props.hostBuild(this.props.build, this._getSelectedGame());
	}

	startGameClick() {
		this.props.startGame(this.props.build);
	}

	render() {
		const { build, buildOpen, buildOpening, hostCode, buildError, buildSettingPath } = this.props;
		const {
			submittingJoinCode,
			glowing,
			selectedGame,
			downloading,
			downloadingProgress,
			unzipStatus,
			enterJoinCode,
			unsettingBuildPathView,
			transitioning
		} = this.state;

		const error = this.state.error || buildError;
		return (
			<div className="build" key={build.id}>
				<div className="build_heading">
					{unsettingBuildPathView &&
					<React.Fragment>
						<a title="Show in Explorer" onClick={this.onBuildNameClick} className="build_name has_path">
							<span className="name">{build.name}</span>
						</a>
						<div className='remove_build_path confirming'>
							<Button
								disabled={transitioning}
								className='error_button'
								onClick={this.confirmUnsetBuildPath}>
								Unset
							</Button>
							<Button
								disabled={transitioning}
								onClick={this.cancelUnsettingBuildPath}>
								Cancel
							</Button>
						</div>
					</React.Fragment>
					}
					{!unsettingBuildPathView &&
					<React.Fragment>
						<div className="path_button">
							<SetBuildPathButton
								{...this.props}
								disabled={transitioning}
								key={build.path}
								downloading={downloading}
							/>
						</div>

						{!!build.path && (
							<a title="Show in Explorer" onClick={this.onBuildNameClick} className="build_name has_path">
								<span className="name">{build.name}</span>
							</a>
						)}
						{!build.path && <span className="build_name">{build.name}</span>}

						{!!build.path && (
							<RemoveBuildPathsButton
								{...this.props}
								beginUnsettingBuildPath={this.beginUnsettingBuildPath}
							/>
						)}
					</React.Fragment>
					}
				</div>

				<div className="build_actions">
					{build.path && (
						<React.Fragment>
							<div className="dolphin_actions">
								{!buildOpen && (
									<React.Fragment>
										{!enterJoinCode &&
										<React.Fragment>
											<Button onClick={this.onLaunchClick}>Open</Button>
											<Button onClick={this.onHostClick}>Host</Button>
											<Button onClick={this.onJoinClick}>Join</Button>
										</React.Fragment>
										}

										{enterJoinCode &&
										<div className='flex-row'>
											<div className="enter_join_code dolphin_actions col s6">
												<input
													className="join_code_input"
													disabled={submittingJoinCode}
													placeholder="Host Code Goes Here"
													type="text"
													value={this.state.joinCode}
													onChange={this.joinCodeChange}
												/>
											</div>
											<div className='buttons col s6'>
												<Button className='go'
												        onClick={this.joinCodeSubmit}
												>
													Go!
												</Button>
												<Button className='cancel error_button '
												        onClick={this.joinCodeCancel}
												>
													Cancel
												</Button>
											</div>
										</div>
										}
									</React.Fragment>
								)}
								{buildOpen && (
									<React.Fragment>
										<Button onClick={this.onCloseClick}>Close</Button>
										{hostCode && <Button onClick={this.onStartGameClick}>Start Game</Button>}
									</React.Fragment>
								)}
							</div>
							{buildOpen && hostCode && <h6 className="host_code">{hostCode}</h6>}
							{!buildOpen &&
							build.getPossibleGames().length > 1 && (
								<div className="select_game_container">
									<Select className="select_game" onChange={this.onSelectedGameChange}
									        value={selectedGame}>
										{build.getPossibleGames().map((game) => (
											<option value={game.id} key={game.id}>
												{game.name}
											</option>
										))}
									</Select>
								</div>
							)}
						</React.Fragment>
					)}
					{!build.path &&
					build.hasDownload() && (
						<React.Fragment>
							{!downloading && (
								<div className="download_pls">
									<div className="installer">
										<Button
											className={`download_build ${glowing ? 'pulse' : ''}`}
											onClick={this.onDownloadClick}
											disabled={transitioning}
										>
											Install <span className="download_arrow">⇩</span>
										</Button>
									</div>
									<span className="download_description">
										If you do not already have <span className="build_name">{build.name}</span> click here
										to install it.
									</span>
								</div>
							)}
							{downloading && (
								<React.Fragment>
									<span className="downloading_status">
										<div>
											<span className="text">{downloading} </span>
											{downloadingProgress && (
												<span
													className="percent">{Math.floor(downloadingProgress * 100)}%</span>
											)}
										</div>
										<div className="nowrap">{unzipStatus}</div>
									</span>
									{downloadingProgress && <ProgressDeterminate percent={downloadingProgress * 100}/>}
									{!downloadingProgress && <ProgressIndeterminate
										windowFocused={this.props.windowFocused}
									/>}
								</React.Fragment>
							)}
						</React.Fragment>
					)}
				</div>

				<div>
					{buildOpening && <ProgressIndeterminate
						windowFocused={this.props.windowFocused}
					/>}
					{buildOpen && !buildOpening && <ProgressDeterminate/>}
					{error && <div className="error">{error}</div>}
				</div>
			</div>
		);
	}
}
