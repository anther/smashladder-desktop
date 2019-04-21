import md5File from 'md5-file/promise';
import Files from '../utils/Files';

export const ADD_ROM_PATH = 'ADD_ROM_PATH';
export const REMOVE_ROM_PATH = 'REMOVE_ROM_PATH';

export const SELECT_ROM_PATH_BEGIN = 'SELECT_ROM_PATH_BEGIN';
export const SELECT_ROM_PATH_SUCCESS = 'SELECT_ROM_PATH_SUCCESS';
export const SELECT_ROM_PATH_FAIL = 'SELECT_ROM_PATH_FAIL';

export const UPDATE_SEARCH_SUBDIRECTORIES = 'UPDATE_SEARCH_SUBDIRECTORIES';
export const UPDATE_ALLOW_DOLPHIN_ANALYTICS = 'UPDATE_ALLOW_DOLPHIN_ANALYTICS';

export const SET_MELEE_ISO_PATH_ACTIVE_ALREADY = 'SET_MELEE_ISO_PATH_ACTIVE_ALREADY';
export const SET_MELEE_ISO_PATH_BEGIN = 'SET_MELEE_ISO_PATH_BEGIN';
export const SET_MELEE_ISO_PATH_SUCCESS = 'SET_MELEE_ISO_PATH_SUCCESS';
export const SET_MELEE_ISO_PATH_FAIL = 'SET_MELEE_ISO_PATH_FAIL';
export const UNSET_MELEE_ISO_PATH = 'UNSET_MELEE_ISO_PATH';

export const MELEE_ISO_VERIFY_BEGIN = 'MELEE_ISO_VERIFY_BEGIN';
export const MELEE_ISO_VERIFY_FAIL = 'MELEE_ISO_VERIFY_FAIL';
export const MELEE_ISO_VERIFY_SUCCESS = 'MELEE_ISO_VERIFY_SUCCESS';

export const SET_DOLPHIN_INSTALL_PATH_BEGIN = 'SET_DOLPHIN_INSTALL_PATH_BEGIN';
export const SET_DOLPHIN_INSTALL_PATH_SUCCESS = 'SET_DOLPHIN_INSTALL_PATH_SUCCESS';
export const SET_DOLPHIN_INSTALL_PATH_FAIL = 'SET_DOLPHIN_INSTALL_PATH_FAIL';
export const UNSET_DOLPHIN_INSTALL_PATH = 'UNSET_DOLPHIN_INSTALL_PATH';


export const addRomPath = path => (dispatch, getState) => {
	const state = getState();
	const paths = state.dolphinSettings.romPaths;
	if (path !== null) {
		paths[path] = path;
	}
	dispatch({
		type: ADD_ROM_PATH,
		payload: {
			romPaths: { ...paths }
		}
	});
};

export const beginSelectingNewRomPath = (title, onSuccessCallback) => (dispatch, getState) => {
	const state = getState();
	if (state.dolphinSettings.selectingRomPath) {
		console.error('already selecting a rom path...');
		return;
	}
	dispatch({
		type: SELECT_ROM_PATH_BEGIN
	});
	Files.selectDirectory('', title || 'Select a Rom Folder')
		.then(selectedPath => {
			if (!selectedPath) {
				throw new Error('No Path was Selected');
			}
			dispatch({
				type: SELECT_ROM_PATH_SUCCESS
			});
			dispatch(addRomPath(selectedPath));
			if (onSuccessCallback) {
				dispatch(onSuccessCallback);
			}
		})
		.catch(error => {
			dispatch({
				type: SELECT_ROM_PATH_FAIL
			});
			console.error(error);
		});
};

export const removeRomPath = path => (dispatch, getState) => {
	const state = getState();
	const paths = state.dolphinSettings.romPaths;
	delete paths[path];
	dispatch({
		type: REMOVE_ROM_PATH,
		payload: {
			romPaths: { ...paths }
		}
	});
};

export const unsetDolphinInstallPath = () => {
	return {
		type: UNSET_DOLPHIN_INSTALL_PATH
	};
};

export const setDolphinInstallPath = () => (dispatch, getState) => {
	const state = getState();

	if (state.dolphinSettings.settingDolphinInstallPath) {
		return;
	}
	dispatch({
		type: SET_DOLPHIN_INSTALL_PATH_BEGIN
	});

	Files.selectDirectory('', 'Select a new Default Dolphin Install Path')
		.then(selectedPath => {
			if (!selectedPath) {
				throw new Error('No path was selected');
			}
			dispatch({
				type: SET_DOLPHIN_INSTALL_PATH_SUCCESS,
				payload: selectedPath
			});
		})
		.catch(error => {
			console.error(error);
			dispatch({
				type: SET_DOLPHIN_INSTALL_PATH_FAIL
			});
		});

};

export const unsetMeleeIsoPath = () => {
	return {
		type: UNSET_MELEE_ISO_PATH
	};
};
export const requestMeleeIsoPath = (onSuccessCallback) => (dispatch, getState) => {
	const state = getState();

	if (state.dolphinSettings.settingMeleeIsoPath) {
		dispatch({
			type: SET_MELEE_ISO_PATH_ACTIVE_ALREADY
		});
		return;
	}
	dispatch({
		type: SET_MELEE_ISO_PATH_BEGIN
	});

	Files.selectFile('', 'Select your Melee Iso!')
		.then(selectedPath => {
			if (!selectedPath) {
				throw new Error('No path was selected');
			}
			console.log('selectedPath');
			dispatch({
				type: MELEE_ISO_VERIFY_BEGIN
			});
			md5File(selectedPath)
				.then((hash) => {
					console.log('the hash!', hash);
					const hashes = require('../constants/meleeHashes.json');
					const buildFound = hashes[hash];
					if (buildFound) {
						if (hash === '0e63d4223b01d9aba596259dc155a174') {
							dispatch({
								type: MELEE_ISO_VERIFY_SUCCESS
							});
						} else {
							dispatch({
								type: MELEE_ISO_VERIFY_FAIL,
								payload: `Found the wrong melee build, the selected ISO is ${buildFound}`
							});
						}
					} else {
						dispatch({
							type: MELEE_ISO_VERIFY_FAIL,
							payload: 'File does not match a known Melee ISO'
						});
					}
				})
				.catch((error) => {
					console.error(error);
					dispatch({
						type: MELEE_ISO_VERIFY_FAIL,
						payload: error.toString(),
					});
				});
			dispatch({
				type: SET_MELEE_ISO_PATH_SUCCESS,
				payload: {
					meleeIsoPath: selectedPath
				}
			});
			if (onSuccessCallback) {
				dispatch(onSuccessCallback());
			}
		})
		.catch(error => {
			console.error(error);
			dispatch({
				type: SET_MELEE_ISO_PATH_FAIL
			});
		});
};

export const updateSearchRomSubdirectories = (checked: boolean) => {
	return {
		type: UPDATE_SEARCH_SUBDIRECTORIES,
		payload: {
			searchRomSubdirectories: checked
		}
	};
};
export const updateAllowDolphinAnalytics = (checked: boolean) => {
	return {
		type: UPDATE_ALLOW_DOLPHIN_ANALYTICS,
		payload: {
			allowDolphinAnalytics: checked
		}
	};
};
