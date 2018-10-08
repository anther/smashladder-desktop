import {
	LAUNCH_REPLAY_BEGIN,
	LAUNCH_REPLAY_END,
	LAUNCH_REPLAY_FAIL,
	LAUNCH_REPLAY_SUCCESS
} from "../actions/replays";

const initialState = {
	launchedReplay: null,
	launchingReplay: null,
	launchReplayError: null,
};

export default (state = initialState, action) => {
	switch(action.type)
	{
		case LAUNCH_REPLAY_BEGIN:
			return {
				...state,
				launchedReplay: null,
				launchingReplay: action.payload.replayPath,
				launchReplayError: null,
			};
		case LAUNCH_REPLAY_FAIL:
			return {
				...state,
				launchedReplay: null,
				launchingReplay: null,
				launchReplayError: action.payload.error,
			};
		case LAUNCH_REPLAY_SUCCESS:
			return {
				...state,
				launchedReplay: action.payload.replayPath,
				launchingReplay: null,
			};
		case LAUNCH_REPLAY_END:
			return{
				...state,
				launchedReplay: null,
				launchingReplay: null,
			};
		default:
			return state;
	}
}