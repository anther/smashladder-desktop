import electronSettings from 'electron-settings';
import { CHECK_FOR_REPLAYS, LAUNCH_REPLAY_BEGIN, LAUNCH_REPLAY_FAIL, LAUNCH_REPLAY_SUCCESS } from "../actions/replays";

const initialState = {
	checkForReplays: electronSettings.get('settings.checkForReplays', true)
};

export default (state = initialState, action) => {
	switch(action.type)
	{
		case CHECK_FOR_REPLAYS:
			electronSettings.set('settings.checkForReplays', action.payload);
			return {
				...state,
				checkForReplays: action.payload,
			};
		case LAUNCH_REPLAY_BEGIN:
			return {
				...state,
				launchingReplay: true,
				launchReplayError: null,
			};
		case LAUNCH_REPLAY_FAIL:
			return {
				...state,
				launchingReplay: false,
				launchReplayError: action.payload.error,
			};
		case LAUNCH_REPLAY_SUCCESS:
			return {
				...state,
				launchingReplay: false,
				checkForReplays: action.payload,
			};
		default:
			return state;
	}
}