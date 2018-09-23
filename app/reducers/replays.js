import { SET_REPLAY_PATH } from "../actions/replays";
import electronSettings from 'electron-settings';

const initialState = {
	path: electronSettings.get('settings.replayPath')
};

export default (state = initialState, action) =>{
	switch(action.type){
		case SET_REPLAY_PATH:
			electronSettings.set('settings.replayPath', action.payload);
			const newState = {
				...state,
				path: action.payload,
			};
			return newState;
		default:
			return state;
	}
}