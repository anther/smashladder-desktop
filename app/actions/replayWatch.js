import fs from 'fs';
import watch from 'node-watch';
import _ from 'lodash';
import Build from '../utils/BuildData';
import { endpoints } from '../utils/SmashLadderAuthentication';
import Replay from '../utils/Replay';
import getAuthenticationFromState from '../utils/getAuthenticationFromState';
import { updateBrowsedReplayList } from './replayBrowse';

export const WATCH_DIRECTORIES_BEGIN = 'WATCH_DIRECTORIES_BEGIN';
export const WATCH_DIRECTORIES_END = 'WATCH_DIRECTORIES_END';
export const WATCH_DIRECTORIES_FAIL = 'WATCH_DIRECTORIES_FAIL';

export const VERIFY_FILE_START = 'VERIFY_FILE_START';
export const VERIFY_FILE_POSSIBLE = 'VERIFY_FILE_POSSIBLE';
export const VERIFY_FILE_FAIL = 'VERIFY_FILE_FAIL';
export const VERIFY_FILE_SUCCESS = 'VERIFY_FILE_SUCCESS';

export const SEND_REPLAY_START = 'SEND_REPLAY_START';
export const SEND_REPLAY_SUCCESS = 'SEND_REPLAY_SUCCESS';
export const SEND_REPLAY_FAIL = 'SEND_REPLAY_FAIL';

export const ENABLE_REPLAY_UPLOADS = 'ENABLE_REPLAY_UPLOADS';
export const DISABLE_REPLAY_UPLOADS = 'DISABLE_REPLAY_UPLOADS';

export const beginWatchingForReplayChanges = () => (dispatch, getState) => {
	console.log('begin watching');
	const state = getState();
	const authentication = getAuthenticationFromState(getState);
	let { replayWatchProcess } = state.replayWatch;
	const { replayWatchEnabled, replayWatchPaths, replayWatchProcessCounter } = state.replayWatch;
	const { ladderWebsocketConnectionEnabled } = state.ladderWebsocket;

	const builds = { ...state.builds.builds };
	if (!ladderWebsocketConnectionEnabled) {
		console.log('connection is disabled');
		return;
	}
	if (!replayWatchEnabled) {
		console.log('watch is not enabled');
		if (replayWatchProcess) {
			dispatch(stopWatchingForReplayChanges('Disabled'));
		}
		return;
	}
	if (!authentication) {
		dispatch(stopWatchingForReplayChanges('No Authentication'));
		return;
	}

	let paths = new Set();
	Build.getSlippiBuilds(builds).forEach((build) =>
		paths.add(build.getSlippiPath())
	);
	paths = Array.from(paths);
	paths.sort();

	if (_.isEqual(replayWatchPaths, paths)) {
		return;
	}

	const limitedCheckReplay = _.debounce((replay) => {
		console.log('checking due to fresh file update');
		checkReplay(replay, replayWatchProcessCounter, dispatch, getState)
			.catch((error) => {
				console.log('oh well');
				console.error(error);
			});
	}, 5000, {
		leading: false,
		trailing: true
	});

	try {
		if (replayWatchProcess) {
			dispatch(stopWatchingForReplayChanges('Starting a new watch process'));
		}
		replayWatchProcess = watch(
			paths,
			{ recursive: false },
			(event, filePath) => {
				if (event === 'remove') {
					return;
				}

				const { verifyingReplayFiles } = getState().replayWatch;

				if (verifyingReplayFiles[filePath]) {
					const replay = Replay.retrieve({ id: filePath });
					console.log('what to check');
					limitedCheckReplay(replay);
				} else {
					fs.lstat(filePath, (err, stats) => {
						if (err) {
							return console.error(err);
						}
						if (stats.isFile()) {
							_.each(verifyingReplayFiles, (replayFilePath) => {
								const replay = Replay.retrieve({ id: replayFilePath });
								checkReplay(replay, replayWatchProcessCounter, dispatch, getState)
									.then((successReplay) => {
										if (!successReplay) {
											dispatch({
												type: VERIFY_FILE_FAIL,
												payload: replay
											});
										}
									})
									.catch((error) => {
										dispatch({
											type: VERIFY_FILE_FAIL,
											payload: replay
										});
									});

							});
							const replay = Replay.retrieve({ id: filePath });
							checkReplay(replay, replayWatchProcessCounter, dispatch, getState)
								.then(() => {
									dispatch(updateBrowsedReplayList());
								})
								.catch((error) => {
									console.log('oh well');
									console.error(error);
								});
						}
					});
				}
			}
		);
		dispatch({
			type: WATCH_DIRECTORIES_BEGIN,
			payload: {
				replayWatchProcess,
				replayWatchPaths: paths
			}
		});
		console.log('watching paths', paths);
	} catch (error) {
		console.log('error with replay watching');
		console.error(error);
		dispatch({
			type: WATCH_DIRECTORIES_FAIL,
			payload: paths
		});
		dispatch(stopWatchingForReplayChanges());
	}
};

export const stopWatchingForReplayChanges = (reason) => {
	return {
		type: WATCH_DIRECTORIES_END,
		payload: reason
	};
};

export const disableReplayWatching = () => (dispatch) => {
	dispatch(stopWatchingForReplayChanges());
	dispatch({
		type: DISABLE_REPLAY_UPLOADS
	});
};

export const enableReplayWatching = () => (dispatch) => {
	dispatch({
		type: ENABLE_REPLAY_UPLOADS
	});
	dispatch(beginWatchingForReplayChanges());
};

const checkReplay = async (replay, watchProcessCounter, dispatch, getState) => {
	console.info(`watch process counter ${watchProcessCounter}`);
	if (!replay) {
		throw new Error('Got an invalid file path');
	}
	const state = getState();
	if (state.replayWatch.sendingReplay) {
		throw new Error('already working with a replay, no reason to get antsy....');
	}
	replay.resetData();
	dispatch({
		type: VERIFY_FILE_START,
		payload: replay
	});
	return loadGame(replay)
		.catch((errors) => {
			dispatch({
				type: VERIFY_FILE_POSSIBLE
			});
			return null;
		})
		.then((replayResult) => {
			if (!replayResult) {
				return;
			}
			return dispatch(sendReplayOff(replay))
				.catch((error) => {
					dispatch({
						type: VERIFY_FILE_FAIL
					});
					console.error(error);
				});
		});
};

export const sendReplayOff = (replay) => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	if (!authentication) {
		return Promise.reject(new Error('Even if file is verified, we are not logged in'));
	}
	const sendableGameData = replay.getSerializableData();
	const sendData = {
		game: JSON.stringify(sendableGameData),
		source: 'slippiLauncher'
	};
	dispatch({
		type: SEND_REPLAY_START,
		payload: replay
	});
	return authentication
		.apiPost(endpoints.SUBMIT_REPLAY_RESULT, sendData)
		.then((response) => {
			dispatch({
				type: SEND_REPLAY_SUCCESS,
				payload: {
					replay: replay
				}
			});
			if (response.other_players) {
				// replay.moveToBetterFileName(
				// 	{others: response.other_players}
				// );
			}
		})
		.catch((response) => {
			console.error('response failed', response);

			try {
				const parsed = JSON.parse(response.error);
				dispatch({
					type: SEND_REPLAY_FAIL,
					payload: {
						error: parsed,
						replay: replay
					}
				});
			} catch (jsonError) {
				dispatch({
					type: SEND_REPLAY_FAIL,
					payload: {
						error: 'Last Replay Send Attempt Failed',
						replay: replay
					}
				});
			}
		});
};

const loadGame = async (replay) => {
	if (!replay.isNewish()) {
		throw new Error('Replay is too old to attempt?');
	}
	if (!replay.isEnded()) {
		throw new Error('Replay is not ended');
	}
	return replay;
};
