import electronSettings from 'electron-settings';
import {
	UPDATE_ALLOW_DOLPHIN_ANALYTICS,
	ADD_ROM_PATH,
	REMOVE_ROM_PATH,
	UPDATE_SEARCH_SUBDIRECTORIES,
	SET_MELEE_ISO_PATH_BEGIN,
	SET_MELEE_ISO_PATH_SUCCESS,
	SET_MELEE_ISO_PATH_FAIL,
	SELECT_ROM_PATH_BEGIN,
	SELECT_ROM_PATH_SUCCESS,
	SELECT_ROM_PATH_FAIL,
	UNSET_MELEE_ISO_PATH,
	SET_DOLPHIN_INSTALL_PATH_BEGIN,
	SET_DOLPHIN_INSTALL_PATH_SUCCESS,
	SET_DOLPHIN_INSTALL_PATH_FAIL,
	UNSET_DOLPHIN_INSTALL_PATH,
	MELEE_ISO_VERIFY_SUCCESS,
	MELEE_ISO_VERIFY_FAIL,
	MELEE_ISO_VERIFY_BEGIN, MELEE_ISO_PATH_ERROR_CONFIRMED
} from '../actions/dolphinSettings';
import defaultDolphinInstallPath from '../constants/defaultDolphinInstallPath';

const evaluatePreviousHash = evaluateMeleeIsoHash(electronSettings.get('dolphinSettings.meleeIsoVerified', null));
console.log('loaded?', evaluatePreviousHash);

const initialState = {
	romPaths: electronSettings.get('dolphinSettings.romPaths', {}),
	searchRomSubdirectories: electronSettings.get('dolphinSettings.searchRomSubdirectories', null),
	allowDolphinAnalytics: electronSettings.get('dolphinSettings.allowDolphinAnalytics', true),
	meleeIsoPath: electronSettings.get('dolphinSettings.meleeIsoPath', null),
	dolphinInstallPath: electronSettings.get('dolphinSettings.dolphinInstallPath', defaultDolphinInstallPath),
	meleeIsoVerified: evaluatePreviousHash.meleeIsoVerified,
	settingMeleeIsoPath: false,
	selectingRomPath: false,
	settingDolphinInstallPath: false,
	meleeIsoPathError: evaluatePreviousHash.meleeIsoPathError,
	meleeIsoPathErrorHash: electronSettings.get('dolphinSettings.meleeIsoPathErrorHash', null)
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
			electronSettings.set('dolphinSettings.meleeIsoPath', action.payload);
			return {
				...newState,
				meleeIsoPath: action.payload,
				settingMeleeIsoPath: false
			};
		case UNSET_MELEE_ISO_PATH:
			electronSettings.set('dolphinSettings.meleeIsoPath', null);
			return {
				...newState,
				meleeIsoPath: null,
				meleeIsoVerified: null
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
		case SET_DOLPHIN_INSTALL_PATH_BEGIN:
			return {
				...newState,
				settingDolphinInstallPath: true
			};
		case MELEE_ISO_VERIFY_BEGIN:
			return {
				...newState,
				meleeIsoPathError: null,
				meleeIsoVerified: null,
				verifyingMeleeIso: true
			};
		case MELEE_ISO_PATH_ERROR_CONFIRMED: {
			electronSettings.set('dolphinSettings.meleeIsoPathErrorHash', state.meleeIsoVerified);
			return {
				...state,
				meleeIsoPathErrorHash: state.meleeIsoVerified
			};
		}
		case MELEE_ISO_VERIFY_FAIL:
			electronSettings.set('dolphinSettings.meleeIsoVerified', false);
			return {
				...newState,
				meleeIsoPathError: action.payload,
				meleeIsoVerified: null,
				verifyingMeleeIso: false
			};
		case MELEE_ISO_VERIFY_SUCCESS: {
			const { hash } = action.payload;
			const update = evaluateMeleeIsoHash(hash);

			electronSettings.set('dolphinSettings.meleeIsoVerified', hash);
			console.log('the update', update);
			return {
				...newState,
				verifyingMeleeIso: false,
				...update
			};
		}
		case SET_DOLPHIN_INSTALL_PATH_SUCCESS:
			electronSettings.set('dolphinSettings.dolphinInstallPath', action.payload);
			return {
				...newState,
				dolphinInstallPath: action.payload,
				settingDolphinInstallPath: false
			};
		case UNSET_DOLPHIN_INSTALL_PATH: {
			electronSettings.set('dolphinSettings.dolphinInstallPath', defaultDolphinInstallPath);
			return {
				...newState,
				dolphinInstallPath: defaultDolphinInstallPath,
				settingDolphinInstallPath: false
			};
		}
		case SET_DOLPHIN_INSTALL_PATH_FAIL:
			return {
				...newState,
				settingDolphinInstallPath: false
			};
		default:
			return state;
	}
};

function evaluateMeleeIsoHash(hash) {
	if (hash === null || hash === false) {
		return {
			meleeIsoPathError: null,
			meleeIsoVerified: null
		};
	}
	const hashes = require('../constants/meleeHashes.json');
	const buildFound = hashes[hash];
	const update = {
		meleeIsoPathError: null,
		meleeIsoVerified: hash
	};
	console.log('found?', buildFound);
	if (buildFound) {
		switch (buildFound.valid) {
			case 'YES':
				break;
			case 'MAYBE1':
				update.meleeIsoPathError = 'This ISO is not a perfect match but has been found to be compatible';
				break;
			case 'MAYBE2':
				update.meleeIsoPathError = 'This ISO is not a perfect match but seems to be compatible with the regular 1.02 build';
				break;
			case 'NO':
				update.meleeIsoPathError = `Found the wrong melee build, the selected ISO is probably ${buildFound}`;
				break;
			default:

				break;
		}
	} else {
		update.meleeIsoPathError = 'File does not match a known Melee ISO';
	}
	return update;
}