import React, { Component } from 'react';
import { shell } from 'electron';
import Button from './elements/Button';
import StocksComponent from './StocksComponent';
import ProgressIndeterminate from './elements/ProgressIndeterminate';
import KillsTable from './KillsTable';
import SlippiPlayer from '../utils/replay/SlippiPlayer';
import Replay from '../utils/Replay';
import StockComponent from './StockComponent';

export default class ReplayComponent extends Component {
	constructor(props) {
		super(props);
		this.onReplayViewClick = this.replayViewClick.bind(this);
		this.onOpenInExplorer = this.openInExplorer.bind(this);
		this.onUploadReplayClick = this.uploadReplay.bind(this);
		this.onDeleteButtonClick = this.deleteButtonClick.bind(this);
		this.onCancelDeleteClick = this.cancelDeleteClick.bind(this);
		this.onDeleteConfirmClick = this.deleteConfirmClick.bind(this);
		this.onDetailsClick = this.detailsClick.bind(this);
		this.onSetMeleeIsoPathClick = this.setMeleeIsoPathClick.bind(this);

		this.playButtonReference = React.createRef();
		this.state = {
			deleteQuestion: false,
			deleting: false
		};
	}

	setMeleeIsoPathClick() {
		this.props.requestMeleeIsoPath();
	}

	detailsClick() {
		this.props.viewReplayDetails(this.props.replay);
	}

	deleteConfirmClick() {
		this.setState({
			deleting: true
		});
		this.props.deleteReplay(this.props.replay.filePath);
	}

	deleteButtonClick() {
		this.setState({
			deleteQuestion: true
		});
	}

	cancelDeleteClick() {
		this.setState({
			deleteQuestion: false
		});
	}

	uploadReplay() {
		// const { replay } = this.props;
		// replay.ignoreNewnessRestriction = true;
		// this.props.checkReplay(this.props.replay.id, 'manual');
	}

	openInExplorer() {
		shell.showItemInFolder(this.props.replay.filePath);
	}

	replayViewClick() {
		const { launchReplay, replay, slippiBuild } = this.props;

		launchReplay({
			replay: replay
		});
	}

	getReplayDisplayString() {
		const { replay, launchedReplay, launchingReplay } = this.props;
		if (replay.id === launchingReplay) {
			return 'Launching...';
		}
		if (replay.id === launchedReplay) {
			return 'Restart?';
		}

		return 'Launch';
	}

	renderElement(title, value) {
		if (this.props.shortSummary) {
			return null;
		}
		return (
			<div className="stat">
				<span className="title">{title}</span>
				<span className="value">{String(value)}</span>
			</div>
		);
	}

	render() {
		const {
			replay,
			meleeIsoPath,
			detailed,
			settingMeleeIsoPath,
			launchingReplay,
			verifyingReplayFiles,
			sendingReplay,
			showMeleeIsoWarning
		} = this.props;

		const { deleteQuestion } = this.state;
		const isBeingWatched = !!verifyingReplayFiles[replay.id];
		const isBeingUploaded = sendingReplay && sendingReplay.id === replay.id;
		const stage = replay.getStage();
		return (
			<React.Fragment>
				{!!showMeleeIsoWarning && !meleeIsoPath &&
				<div className='set_melee_iso_path'>
					<Button
						className='btn-small not_set no_check'
						disabled={settingMeleeIsoPath}
						onClick={this.onSetMeleeIsoPathClick}
					>
						{settingMeleeIsoPath && <ProgressIndeterminate
							windowFocused={this.props.windowFocused}
						/>}
						Set Melee ISO Path
					</Button>
					<span className='error center error_reason'>
					Path needs to be set before you can play replays
					</span>
				</div>
				}
				<div className="replay_content">
					<div className='watching_replay'>
						{(isBeingWatched || isBeingUploaded) &&
						<ProgressIndeterminate
							windowFocused={this.props.windowFocused}
						/>
						}
					</div>
					<a className="game_data waves-effect" onClick={this.onOpenInExplorer}>
						<div className="details">
							{stage && (
								<div className="stage">
									<img alt={stage.name} src={stage.imageUrl()}/>
								</div>
							)}
							<div className="match_time">
								<span className="when">
									{isBeingWatched &&
									<span>Started{' '}</span>
									}
									{replay.getFileDate() ? replay.getFileDate().calendar() : ''}
								</span>
								{replay.metadataIsComplete() &&
								<div className='match_time_display'>
									{replay.getMatchTime() && <span>{replay.getMatchTime()}</span>}
									{!replay.getMatchTime() && (
										<div>
											{isBeingUploaded &&
											<span>Uploading Results...</span>
											}
											{isBeingWatched &&
											<span>Waiting for Replay to Finish</span>
											}
											{!replay.isALittleGlitchy() && !isBeingWatched &&
											<React.Fragment>
												<div className="error error_reason">
													Dolphin Closed Before Match Ended?
												</div>
											</React.Fragment>
											}
										</div>
									)}
								</div>
								}
								{replay.isEnded() &&
								replay.getGameEnd().gameEndMethod === Replay.REPLAY_END_LRA_START &&
								<div className='lra_start'>Exited by {replay.getLraStartPlayerName()}</div>
								}
							</div>
						</div>
						<div className='stocks_container'>
							{replay.getPlayers().map((player) => {
								if (!(player instanceof SlippiPlayer)) {
									console.log(replay);
									console.error('player was a failure for some reason');
									return null;
								}
								return (
									<div className="player" key={player.playerIndex}>
										<div className='nametag'>
											{player.getNameTag()}
										</div>
										{player.stocks.size > 0 &&
										<StocksComponent
											stocks={player.getLadderStocks()}
											showSelfDestructs
										/>
										}
										{!player.stocks.size &&
										<div className='stocks'>
											<StockComponent
												stockIconUrl={player.character.getStockIcon()}
											/>
										</div>
										}
										{detailed && (
											<div className="detailed_stats">
												{this.renderElement('Kills', player.overall.killCount)}
												{!!player.overall.openingsPerKill && this.renderElement(
													'Openings Per Kill',
													player.overall.openingsPerKill.ratio
														? player.overall.openingsPerKill.ratio.toFixed(1)
														: 'N/A'
												)}
												{this.renderElement(
													'Total Damage',
													`${
														player.overall.totalDamage
															? player.overall.totalDamage.toFixed(1)
															: 0
														}%`
												)}
												{this.renderElement(
													'Wavelands',
													player.actions.wavelandCount
												)}
												{this.renderElement(
													'Wavedashes',
													player.actions.wavedashCount
												)}
												{this.renderElement(
													'Dash Dances',
													player.actions.dashDanceCount
												)}

												<h4>
													Kills
												</h4>
												<div className='kills'>
													<KillsTable
														game={replay}
														playerDisplay={player.character.name}
														playerIndex={player.playerIndex}
													/>
												</div>
											</div>

										)}
									</div>
								);
							})}
						</div>
					</a>

					<div className="controls">
						{meleeIsoPath && !stage &&
						<div className="file_data">
							<div className="file_name_holder">
								<a onClick={this.onOpenInExplorer} className="file_name">
									{replay.getFileName()}
								</a>
							</div>
						</div>
						}

						<div className={`main_buttons ${deleteQuestion ? 'deleting' : ''}`}>
							{deleteQuestion && (
								<React.Fragment>
									<h6 className="title">Delete?</h6>
									<div className="main_buttons">
										<div className="input-field">
											<Button
												disabled={this.state.deleting}
												onClick={this.onDeleteConfirmClick}
												className="error_button btn-small"
											>
												Yes
											</Button>
										</div>
										<div className="input-field">
											<Button
												disabled={this.state.deleting}
												onClick={this.onCancelDeleteClick}
												className="btn-small"
											>
												No
											</Button>
										</div>
									</div>
								</React.Fragment>
							)}

							{!deleteQuestion && (
								<React.Fragment>
									<div className="input-field">
										<Button
											disabled={true || settingMeleeIsoPath || launchingReplay || !meleeIsoPath}
											onClick={this.onReplayViewClick}
											className={`btn-small ${
												meleeIsoPath ? 'set no_check' : 'not_set no_check'}`}
										>
											{launchingReplay && <span>...</span>}
											{!launchingReplay && (
												<i className="fa fa-caret-right"/>
											)}
										</Button>
									</div>
									{!replay.hasErrors && (
										<div className="input-field">
											<Button
												onClick={this.onDetailsClick}
												className="btn-small btn-flat"
											>
												<i className="fa fa-info-circle"/>
											</Button>
										</div>
									)}

									{false && (
										<div className="input-field">
											<Button onClick={this.onUploadReplayClick}>
												Upload Replay
											</Button>
										</div>
									)}
									<div className="input-field">
										<Button
											onClick={this.onDeleteButtonClick}
											className="btn-small error_button"
										>
											<i className="fa fa-trash"/>
										</Button>
									</div>
								</React.Fragment>
							)}
						</div>
					</div>
				</div>
			</React.Fragment>
		);
	}
}


