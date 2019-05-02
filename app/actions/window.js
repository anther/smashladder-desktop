import { ipcRenderer } from 'electron';

export const WINDOW_FOCUS = 'WINDOW_FOCUS';
export const WINDOW_BLUR = 'WINDOW_BLUR';
export const WINDOW_WATCH_INITIALIZE_SUCCESS = 'WINDOW_WATCH_INITIALIZE_SUCCESS';
export const WINDOW_WATCH_INITIALIZE_FAIL = 'WINDOW_WATCH_INITIALIZE_FAIL';


export const startWindowWatcher = () => (dispatch, getState) => {
	console.log('initializing window watcherz');
	const state = getState();
	if (state.window.watchInitialized) {
		dispatch({
			type: WINDOW_WATCH_INITIALIZE_FAIL
		});
		return;
	}
	dispatch({
		type: WINDOW_WATCH_INITIALIZE_SUCCESS
	});
	ipcRenderer.send('windowFocusEvents');
	ipcRenderer.on('blur', () => {
		dispatch(windowBlur());
	});
	ipcRenderer.on('focus', () => {
		dispatch(windowFocus());
	});
};

export const windowFocus = () => {
	return {
		type: WINDOW_FOCUS
	};
};

export const windowBlur = () => {
	return {
		type: WINDOW_BLUR
	};
};