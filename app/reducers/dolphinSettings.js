import electronSettings from 'electron-settings';
import { UPDATE_ALLOW_DOLPHIN_ANALYTICS, ADD_ROM_PATH, REMOVE_ROM_PATH, UPDATE_SEARCH_SUBDIRECTORIES } from "../actions/dolphinSettings";


const initialState = {
	romPaths: electronSettings.get('dolphinSettings.romPaths', {}),
	searchRomSubdirectories: electronSettings.get('dolphinSettings.searchRomSubdirectories', null),
	allowDolphinAnalytics: electronSettings.get('dolphinSettings.allowDolphinAnalytics', true),
};

export default (state = initialState, action) => {

	const newState = {
		...state,
		...action.payload,
	};
	switch(action.type)
	{
		case ADD_ROM_PATH:
		case REMOVE_ROM_PATH:
			electronSettings.set('dolphinSettings.romPaths', action.payload.romPaths);
			return newState;
		case UPDATE_SEARCH_SUBDIRECTORIES:
			electronSettings.set('dolphinSettings.searchRomSubdirectories', action.payload.searchRomSubdirectories);
			return newState;
		case UPDATE_ALLOW_DOLPHIN_ANALYTICS:
			electronSettings.set('dolphinSettings.allowDolphinAnalytics', action.payload.allowDolphinAnalytics);
			return newState;
		default:
			return state;
	}
}