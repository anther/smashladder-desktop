import electronSettings from 'electron-settings';


import {
	DISABLE_REPLAY_UPLOADS,
	ENABLE_REPLAY_UPLOADS,
	SEND_REPLAY_FAIL, SEND_REPLAY_START,
	SEND_REPLAY_SUCCESS, VERIFY_FILE_FAIL, VERIFY_FILE_START, VERIFY_FILE_SUCCESS, WATCH_DIRECTORIES_BEGIN,
	WATCH_DIRECTORIES_END, WATCH_DIRECTORIES_FAIL, WATCH_DIRECTORIES_SUCCESS
} from "../actions/replayWatch";


const initialState = {
	replayWatchEnabled: electronSettings.get('settings.replayWatchEnabled', true),
	watchingForNewReplays: false,
	sendingReplay: false,
	lastSubmittedReplay: null,
	replayWatchPaths: [],
	lastReplaySubmissionError: null,
	verifyingReplayFile: null,
	watchForNewReplaysEndReason: null,
};

export default (state = initialState, action) => {
	switch(action.type)
	{
		case WATCH_DIRECTORIES_BEGIN:
			return {
				...state,
				replayWatchPaths: action.payload,
				watchForNewReplaysEndReason: null,
			};
		case WATCH_DIRECTORIES_SUCCESS:
			return {
				...state,
				watchingForNewReplays: true,
				replayWatchPaths: action.payload,
				watchForNewReplaysEndReason: null,
			};
		case WATCH_DIRECTORIES_END:
			return {
				...state,
				watchingForNewReplays: false,
				replayWatchPaths: [],
				watchForNewReplaysEndReason: action.payload,
			};
		case WATCH_DIRECTORIES_FAIL:
			return {
				...state,
				watchingForNewReplays: false,
				replayWatchPaths: []
			};
		case SEND_REPLAY_START:
			return {
				...state,
				sendingReplay: action.payload,
			};
		case SEND_REPLAY_SUCCESS:
			return {
				...state,
				sendingReplay: null,
			};
		case SEND_REPLAY_FAIL:
			return {
				...state,
				sendingReplay: null,
			};
		case ENABLE_REPLAY_UPLOADS:
			return {
				...state,
				replayWatchEnabled: electronSettings.set('settings.replayWatchEnabled', true),
			};
		case DISABLE_REPLAY_UPLOADS:
			return {
				...state,
				replayWatchEnabled: electronSettings.set('settings.replayWatchEnabled', false),
			};
		case VERIFY_FILE_START:
			return {
				...state,
				verifyingReplayFile: action.payload,
			};
		case VERIFY_FILE_SUCCESS:
		case VERIFY_FILE_FAIL:
			return {
				...state,
				verifyingReplayFile: null,

			};
		default:
			return state;
	}
}