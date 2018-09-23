

export const SET_REPLAY_PATH = 'SET_REPLAY_PATH';

export const setReplayPath = (path) => {
	return {
		type: SET_REPLAY_PATH,
		payload: path
	};
};