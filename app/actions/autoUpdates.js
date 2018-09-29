const { ipcRenderer } = require('electron');

export const CHECK_FOR_UPDATES_BEGIN = 'CHECK_FOR_UPDATES_BEGIN';
export const CHECK_FOR_UPDATES_FAIL = 'CHECK_FOR_UPDATES_FAIL';
export const CHECK_FOR_UPDATES_FOUND_UPDATE = 'CHECK_FOR_UPDATES_FOUND_UPDATE';
export const CHECK_FOR_UPDATES_NO_UPDATES = 'CHECK_FOR_UPDATES_NO_UPDATES';

export const UPDATE_DOWNLOAD_BEGIN = 'UPDATE_DOWNLOAD_BEGIN';
export const UPDATE_DOWNLOAD_SUCCESS = 'UPDATE_DOWNLOAD_SUCCESS';
export const UPDATE_DOWNLOAD_FAIL = 'UPDATE_DOWNLOAD_FAIL';

export const startAutoUpdate = () => (dispatch, getState) => {
	const state = getState();
	if(!state.autoUpdates.hasUpdate)
	{
		return dispatch({
			type: UPDATE_DOWNLOAD_FAIL,
			payload: 'No Update Available'
		})
	}
	ipcRenderer.send('autoUpdate-start');
	dispatch({
		type: UPDATE_DOWNLOAD_BEGIN,
	});
};
export const initializeAutoUpdater = () => (dispatch) => {
	console.error('when?');
	ipcRenderer.on('autoUpdate-error', (error) => {
		dispatch({
			type: CHECK_FOR_UPDATES_FAIL,
			payload: error == null ? "unknown" : (error.stack || error).toString()
		});
	});

	ipcRenderer.on('autoUpdate-update-available', () => {
		dispatch({
			type: CHECK_FOR_UPDATES_FOUND_UPDATE,
		});
	});

	ipcRenderer.on('autoUpdate-update-not-available', () => {
		dispatch({
			type: CHECK_FOR_UPDATES_NO_UPDATES,
		});
	});

	ipcRenderer.on('autoUpdate-update-downloaded', () => {
		dispatch({
			type: UPDATE_DOWNLOAD_SUCCESS,
		});
	});

	ipcRenderer.send('autoUpdate-initialize');

	dispatch({
		type: CHECK_FOR_UPDATES_BEGIN
	});
};