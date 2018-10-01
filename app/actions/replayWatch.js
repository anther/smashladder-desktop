import Build from "../utils/BuildData";
import fs from "fs";
import watch from 'node-watch';
import path from 'path';
import Files from '../utils/Files';
import _ from 'lodash';
import Constants from "../utils/Constants";
import { endpoints } from "../utils/SmashLadderAuthentication";
import Replay from "../utils/Replay";
import multitry from "../utils/multitry";
import getAuthenticationFromState from "../utils/getAuthenticationFromState";

export const WATCH_DIRECTORIES_BEGIN = 'WATCH_DIRECTORIES_BEGIN';
export const WATCH_DIRECTORIES_SUCCESS = 'WATCH_DIRECTORIES_SUCCESS';
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

let replayWatchProcess = null;

export const beginWatchingForReplayChanges = () => (dispatch, getState) => {
	const state = getState();
	const authentication = getAuthenticationFromState(getState);
	const connectionEnabled = state.login.connectionEnabled;
	const checkForReplays = state.replays.checkForReplays;
	const watchingPaths = state.replayWatch.replayWatchPaths;

	const builds = { ...state.builds.builds };
	if (!connectionEnabled) {
		return;
	}
	if (!checkForReplays) {
		if(replayWatchProcess)
		{
			dispatch(stopWatchingForReplayChanges('Disabled'));
		}
		return;
	}
	if (!authentication) {
		dispatch(stopWatchingForReplayChanges('No Authentication'));
		return;
	}

	const paths = Build.getSlippiBuilds(builds)
		.map((build)=>(build.getSlippiPath()));

	if (!_.isEqual(watchingPaths.sort(), paths.sort())) {
		dispatch({
			type: WATCH_DIRECTORIES_BEGIN,
			payload: paths,
		});
		// This is purely for display purposes
		// clearTimeout(this.reinitializingTimeout);
		// this.setState({reinitializing: `Updating New Paths...`});
		// this.reinitializingTimeout = setTimeout(()=>{
		// 	this.setState({reinitializing: null});
		// }, 2000);

		try{

			replayWatchProcess = watch(watchingPaths, { recursive: false }, (event, filePath) => {
				if (event === 'remove') {
					return;
				}
				fs.lstat(filePath, (err, stats) => {
					if (err) {
						return console.error(err); // Handle error
					}

					if (stats.isFile()) {
						dispatch(checkReplay(filePath));
					}
				});
			});
		}
		catch(error)
		{
			console.log('error with replay watching');
			console.error(error);
			dispatch({
				type: WATCH_DIRECTORIES_FAIL,
				payload: paths,
			});
			dispatch(stopWatchingForReplayChanges());
		}
	}
};

export const stopWatchingForReplayChanges = (reason) => {
	if (replayWatchProcess) {
		replayWatchProcess.close();
		replayWatchProcess = null;
	}
	return({
		type: WATCH_DIRECTORIES_END,
		payload: reason,
	});
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
};

export const checkReplay = (filePath) => (dispatch, getState) => {
	if(!filePath)
	{
		console.error('got an invalid file path...');
		return;
	}
	const state = getState();
	if(state.replayWatch.sendingReplay)
	{
		console.log('already working with a replay, no reason to get antsy....');
		return;
	}
	dispatch({
		type: VERIFY_FILE_START,
		payload: filePath
	});
	if(filePath.endsWith(Constants.SLIPPI_REPLAY_FILE_NAME))
	{
		console.log('file is the watcher replay file, so we ignore this mofo');
		dispatch({
			type: VERIFY_FILE_FAIL
		});
		return;
	}
	loadGame(filePath)
		.catch(errors => {
			dispatch({
				type: VERIFY_FILE_FAIL
			});
			console.log(`could not get legit data from replay ${filePath}`);
			if(errors)
			{
				throw errors[0];
			}
			else
			{
				throw new Error('error using replay');
			}
		})
		.then(replay => {
			dispatch(sendReplayOff(replay));
		})
		.catch(error => {
			dispatch({
				type: VERIFY_FILE_FAIL
			});
			console.error(error);
		});
};

export const sendReplayOff = (replay) => (dispatch, getState) => {
	const authentication = getAuthenticationFromState(getState);
	if(!authentication)
	{
		throw new Error('Even if file is verified, we are not logged in');
	}
	replay.getMetadata();
	const sendableGameData = {
		metadata: replay.rawData.metadata,
		stats: replay.rawData.stats,
		settings: replay.rawData.settings,
	};
	const sendData = {
		game: JSON.stringify(sendableGameData),
		source: 'slippiLauncher'
	};

	console.log('sending', sendableGameData);

	dispatch({
		type: SEND_REPLAY_START,
		payload: replay,
	});
	authentication
		.apiPost(endpoints.SUBMIT_REPLAY_RESULT, sendData)
		.then(response => {
			dispatch({
				type: SEND_REPLAY_SUCCESS,
				payload: replay,
			});
			if (response.other_players) {
				// replay.moveToBetterFileName(
				// 	{others: response.other_players}
				// );
			}
		})
		.catch(response => {
			console.error('response failed', response);

			try{
				const parsed = JSON.parse(response.error);
				dispatch({
					type: SEND_REPLAY_FAIL,
					payload: parsed
				});
			}
			catch(jsonError)
			{
				dispatch({
					type: SEND_REPLAY_FAIL,
					payload: 'Last Replay Send Attempt Failed',
				});
			}
		});
};

const loadGame = (file) => {
	const replay = Replay.retrieve({id: file});
	return multitry(1500, 3, () => {
		replay.resetData();
		if (!replay.isReadable()) {
			throw new Error('Invalid data');
		}
		if(!replay.isNewish())
		{
			throw new Error('Replay is too old to attempt?');
		}
		return replay;
	});
}