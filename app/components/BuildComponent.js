import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { remote, shell } from 'electron';

import Build from '../utils/BuildData';

import Button from './elements/Button';
import Select from './elements/Select';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import ProgressDeterminate from './elements/ProgressDeterminate';
import RemoveBuildPathsButton from './elements/RemoveBuildPathsButton';
import SetBuildPathButton from './elements/SetBuildPathButton';

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
		dolphinInstallPath: PropTypes.string.isRequired,
		windowFocused: PropTypes.bool.isRequired,
		buildDownload: PropTypes.object,
		buildSettingPath: PropTypes.string,
		downloadActive: PropTypes.number,
		downloading: PropTypes.string,
		downloadError: PropTypes.string,
		downloadingProgress: PropTypes.number,
		unzipStatus: PropTypes.string
	};

	static defaultProps = {
		buildError: null,
		buildDownload: null,
		buildSettingPath: null,
		downloadActive: null,
		downloading: null,
		downloadError: null,
		downloadingProgress: null,
		unzipStatus: null
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
		this.props.downloadBuild(this.props.build);
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
		const { build, buildOpen, buildOpening, hostCode, buildError, windowFocused, buildSettingPath } = this.props;
		const {
			submittingJoinCode,
			glowing,
			selectedGame,
			enterJoinCode,
			unsettingBuildPathView,
			transitioning
		} = this.state;
		let buildDownload = null;
		let { downloadActive, downloading, downloadError, downloadingProgress, unzipStatus } = this.props;
		if (downloadActive !== build.id) {
			downloading = null;
			downloadError = null;
			downloadingProgress = null;
			unzipStatus = null;
		}


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
						<SetBuildPathButton
							{...this.props}
							disabled={transitioning}
							key={build.path}
							downloading={downloading}
						/>

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
										windowFocused={windowFocused}
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
