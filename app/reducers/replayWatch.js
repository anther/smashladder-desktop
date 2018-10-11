import electronSettings from 'electron-settings';

import {
	DISABLE_REPLAY_UPLOADS,
	ENABLE_REPLAY_UPLOADS,
	SEND_REPLAY_FAIL,
	SEND_REPLAY_START,
	SEND_REPLAY_SUCCESS,
	VERIFY_FILE_FAIL,
	VERIFY_FILE_POSSIBLE,
	VERIFY_FILE_START,
	VERIFY_FILE_SUCCESS,
	WATCH_DIRECTORIES_BEGIN,
	WATCH_DIRECTORIES_END,
	WATCH_DIRECTORIES_FAIL,
} from '../actions/replayWatch';

const initialState = {
	replayWatchEnabled: electronSettings.get('settings.replayWatchEnabled', true),
	watchingForNewReplays: false,
	sendingReplay: false,
	lastSubmittedReplay: null,
	replayWatchPaths: [],
	lastReplaySubmissionError: null,
	verifyingReplayFile: null,
	watchForNewReplaysEndReason: null,
	replayWatchProcess: null,
	replayWatchProcessCounter: 0
};

export default (state = initialState, action) => {
	switch (action.type) {
		case WATCH_DIRECTORIES_BEGIN:
			return {
				...state,
				replayWatchProcess: action.payload.replayWatchProcess,
				replayWatchProcessCounter: (state.replayWatchProcessCounter += 1),
				replayWatchPaths: action.payload.replayWatchPaths,
				watchForNewReplaysEndReason: null
			};
		case WATCH_DIRECTORIES_END:
			if (state.replayWatchProcess) {
				state.replayWatchProcess.close();
			}
			return {
				...state,
				watchingForNewReplays: false,
				replayWatchPaths: [],
				watchForNewReplaysEndReason: action.payload
			};
		case WATCH_DIRECTORIES_FAIL:
			if (state.replayWatchProcess) {
				state.replayWatchProcess.close();
			}
			return {
				...state,
				watchingForNewReplays: false,
				replayWatchPaths: []
			};
		case SEND_REPLAY_START:
			return {
				...state,
				sendingReplay: action.payload
			};
		case SEND_REPLAY_SUCCESS:
			return {
				...state,
				sendingReplay: null,
				verifyingReplayFile: null
			};
		case SEND_REPLAY_FAIL:
			return {
				...state,
				sendingReplay: null,
				verifyingReplayFile: null
			};
		case ENABLE_REPLAY_UPLOADS:
			electronSettings.set('settings.replayWatchEnabled', true);
			return {
				...state,
				replayWatchEnabled: true
			};
		case DISABLE_REPLAY_UPLOADS:
			electronSettings.set('settings.replayWatchEnabled', false);
			return {
				...state,
				replayWatchEnabled: false,
				replayWatchPaths: []
			};
		case VERIFY_FILE_START:
			return {
				...state,
				verifyingReplayFile: action.payload
			};
		case VERIFY_FILE_SUCCESS:
		case VERIFY_FILE_POSSIBLE:
			return {
				...state
			};
		case VERIFY_FILE_FAIL:
			return {
				...state,
				verifyingReplayFile: null
			};
		default:
			return state;
	}
};
