import fs from 'fs';
import watch from 'node-watch';
import _ from 'lodash';
import Build from '../utils/BuildData';
import Constants from '../utils/Constants';
import { endpoints } from '../utils/SmashLadderAuthentication';
import Replay from '../utils/Replay';
import multitry from '../utils/multitry';
import getAuthenticationFromState from '../utils/getAuthenticationFromState';

export const WATCH_DIRECTORIES_BEGIN = 'WATCH_DIRECTORIES_BEGIN';
export const WATCH_DIRECTORIES_END = 'WATCH_DIRECTORIES_END';
export const WATCH_DIRECTORIES_FAIL = 'WATCH_DIRECTORIES_FAIL';

export const VERIFY_FILE_START = 'VERIFY_FILE_START';
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
	const connectionEnabled = state.login.connectionEnabled;
	const replayWatchEnabled = state.replayWatch.replayWatchEnabled;
	const watchingPaths = state.replayWatch.replayWatchPaths;
	let replayWatchProcess = state.replayWatch.replayWatchProcess;
	const replayWatchProcessCounter = state.replayWatch.replayWatchProcessCounter;

	const builds = { ...state.builds.builds };
	if (!connectionEnabled) {
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

	const paths = Build.getSlippiBuilds(builds).map((build) =>
		build.getSlippiPath()
	);

	if (_.isEqual(watchingPaths.sort(), paths.sort())) {
		console.log('already wtaching same paths?');
		return;
	}
	// This is purely for display purposes
	// clearTimeout(this.reinitializingTimeout);
	// this.setState({reinitializing: `Updating New Paths...`});
	// this.reinitializingTimeout = setTimeout(()=>{
	// 	this.setState({reinitializing: null});
	// }, 2000);

	try {
		if (replayWatchProcess) {
			dispatch(stopWatchingForReplayChanges('Starting a new watch process'));
		}
		const limitedReplayUpdate = _.debounce(
			(event, filePath) => {
				console.log('lmited replay send ', event);
				if (event === 'remove') {
					return;
				}
				fs.lstat(filePath, (err, stats) => {
					if (err) {
						return console.error(err);
					}

					if (stats.isFile()) {
						dispatch(checkReplay(filePath, replayWatchProcessCounter));
					}
				});
			},
			2000,
			{
				leading: true,
				trailing: true
			}
		);
		replayWatchProcess = watch(
			paths,
			{ recursive: false },
			(event, filePath) => {
				console.log('want to upload but... we should wait');
				limitedReplayUpdate(event, filePath);
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

export const checkReplay = (filePath, watchProcessCounter) => (
	dispatch,
	getState
) => {
	console.info(`watch process counter ${watchProcessCounter}`);
	if (!filePath) {
		console.error('got an invalid file path...');
		return;
	}
	const state = getState();
	if (state.replayWatch.sendingReplay) {
		console.log('already working with a replay, no reason to get antsy....');
		return;
	}
	dispatch({
		type: VERIFY_FILE_START,
		payload: filePath
	});
	if (filePath.endsWith(Constants.SLIPPI_REPLAY_FILE_NAME)) {
		console.log('file is the watcher replay file, so we ignore this mofo');
		dispatch({
			type: VERIFY_FILE_FAIL
		});
		return;
	}
	loadGame(filePath)
		.catch((errors) => {
			dispatch({
				type: VERIFY_FILE_FAIL
			});
			if (errors) {
				throw errors[0];
			} else {
				throw new Error('error using replay');
			}
		})
		.then((replay) => {
			dispatch(sendReplayOff(replay));
		})
		.catch((error) => {
			dispatch({
				type: VERIFY_FILE_FAIL
			});
			console.error(error);
		});
};

export const sendReplayOff = (replay) => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	if (!authentication) {
		throw new Error('Even if file is verified, we are not logged in');
	}
	const sendableGameData = replay.getSerializableData();
	const sendData = {
		game: JSON.stringify(sendableGameData),
		source: 'slippiLauncher'
	};

	console.log('sending', sendableGameData);

	dispatch({
		type: SEND_REPLAY_START,
		payload: replay
	});
	authentication
		.apiPost(endpoints.SUBMIT_REPLAY_RESULT, sendData)
		.then((response) => {
			dispatch({
				type: SEND_REPLAY_SUCCESS,
				payload: replay
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
					payload: parsed
				});
			} catch (jsonError) {
				dispatch({
					type: SEND_REPLAY_FAIL,
					payload: 'Last Replay Send Attempt Failed'
				});
			}
		});
};

const loadGame = async (file) => {
	console.log('load game attempt ', file);
	const replay = Replay.create({ id: file });
	return multitry(1000, 1, () => {
		if (!replay.isReadable()) {
			throw new Error(replay.getErrorReasons());
		}
		if (!replay.isNewish()) {
			throw new Error('Replay is too old to attempt?');
		}
		return replay;
	});
};
