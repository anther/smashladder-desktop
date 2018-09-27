import electronSettings from "electron-settings";

export const UPDATE_ROM_PATH = 'UPDATE_ROM_PATH';
export const UPDATE_SEARCH_SUBDIRECTORIES = 'UPDATE_SEARCH_SUBDIRECTORIES';


export const updateRomPath = (path) => {
	electronSettings.set('romPath', path);
	return {
		type: UPDATE_ROM_PATH,
		payload: {
			romPath: path
		}
	}
};
export const updateSearchSubdirectories = (checked: boolean) => {
	electronSettings.set('searchRomSubdirectories', checked);
	return {
		type: UPDATE_SEARCH_SUBDIRECTORIES,
		payload: {
			searchRomSubdirectories: checked
		}
	}
};