import electronSettings from 'electron-settings';
import {
	UPDATE_ALLOW_DOLPHIN_ANALYTICS, ADD_ROM_PATH, REMOVE_ROM_PATH, UPDATE_SEARCH_SUBDIRECTORIES,
	SET_MELEE_ISO_PATH_BEGIN, SET_MELEE_ISO_PATH_SUCCESS, SET_MELEE_ISO_PATH_FAIL,
	SELECT_ROM_PATH_BEGIN, SELECT_ROM_PATH_SUCCESS, SELECT_ROM_PATH_FAIL, UNSET_MELEE_ISO_PATH
} from '../actions/dolphinSettings';


const initialState = {
	romPaths: electronSettings.get('dolphinSettings.romPaths', {}),
	searchRomSubdirectories: electronSettings.get('dolphinSettings.searchRomSubdirectories', null),
	allowDolphinAnalytics: electronSettings.get('dolphinSettings.allowDolphinAnalytics', true),
	meleeIsoPath: electronSettings.get('dolphinSettings.meleeIsoPath', null),
	settingMeleeIsoPath: false,
	selectingRomPath: false
};

export default (state = initialState, action) => {

	const newState = {
		...state,
		...action.payload
	};
	switch (action.type) {
		case SELECT_ROM_PATH_BEGIN:
			return {
				...newState,
				selectingRomPath: true
			};
		case SELECT_ROM_PATH_SUCCESS:
		case SELECT_ROM_PATH_FAIL:
			return {
				...newState,
				selectingRomPath: false
			};
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
		case SET_MELEE_ISO_PATH_SUCCESS:
			electronSettings.set('dolphinSettings.meleeIsoPath', action.payload.meleeIsoPath);
			return {
				...newState,
				settingMeleeIsoPath: false
			};
		case UNSET_MELEE_ISO_PATH:
			electronSettings.set('dolphinSettings.meleeIsoPath', null);
			return {
				...newState,
				meleeIsoPath: null
			};
		case SET_MELEE_ISO_PATH_BEGIN:
			return {
				...newState,
				settingMeleeIsoPath: true
			};
		case SET_MELEE_ISO_PATH_FAIL:
			return {
				...newState,
				settingMeleeIsoPath: false
			};
		default:
			return state;
	}
}