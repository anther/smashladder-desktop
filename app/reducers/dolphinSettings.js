import electronSettings from 'electron-settings';
import { UPDATE_ALLOW_DOLPHIN_ANALYTICS, ADD_ROM_PATH, REMOVE_ROM_PATH, UPDATE_SEARCH_SUBDIRECTORIES } from "../actions/dolphinSettings";


const initialState = {
	romPaths: electronSettings.get('dolphinSettings.romPaths', {}),
	searchRomSubdirectories: electronSettings.get('dolphinSettings.searchRomSubdirectories', null),
	allowDolphinAnalytics: electronSettings.get('dolphinSettings.allowDolphinAnalytics', true),
};

export default (state = initialState, action) => {

	switch(action.type)
	{
		case ADD_ROM_PATH:
		case REMOVE_ROM_PATH:
		case UPDATE_SEARCH_SUBDIRECTORIES:
		case UPDATE_ALLOW_DOLPHIN_ANALYTICS:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
}