/* eslint-disable prefer-destructuring */
import { ipcRenderer } from 'electron';
import _ from 'lodash';

export const CHECK_FOR_UPDATES_BEGIN = 'CHECK_FOR_UPDATES_BEGIN';
export const CHECK_FOR_UPDATES_FAIL = 'CHECK_FOR_UPDATES_FAIL';
export const CHECK_FOR_UPDATES_FOUND_UPDATE = 'CHECK_FOR_UPDATES_FOUND_UPDATE';
export const CHECK_FOR_UPDATES_NO_UPDATES = 'CHECK_FOR_UPDATES_NO_UPDATES';

export const UPDATE_DOWNLOAD_BEGIN = 'UPDATE_DOWNLOAD_BEGIN';
export const UPDATE_DOWNLOAD_SUCCESS = 'UPDATE_DOWNLOAD_SUCCESS';
export const UPDATE_DOWNLOAD_FAIL = 'UPDATE_DOWNLOAD_FAIL';

export const startAutoUpdate = () => (dispatch, getState) => {
  const state = getState();
  if (!state.autoUpdates.updateAvailable) {
    console.log('Cannot initiate download because no update was confirmed');
    return dispatch({
      type: UPDATE_DOWNLOAD_FAIL,
      payload: 'No Update Available'
    });
  }
  console.log('Triggering auto update start');
  ipcRenderer.send('autoUpdate-start');
  dispatch({
    type: UPDATE_DOWNLOAD_BEGIN
  });
};
export const initializeAutoUpdater = () => dispatch => {
  const listeners = {
    'autoUpdate-initialized': () => {
      console.log('received initialized signal back');
    },
    'autoUpdate-error': (event, error) => {
      console.log('autoupdate error');
      console.error(error);
      let cause = '';
      if (error === null) {
        cause = 'unknown';
      } else if (error.cause) {
        cause = error.cause;
      } else {
        cause = 'Something went wrong';
      }
      dispatch({
        type: CHECK_FOR_UPDATES_FAIL,
        payload: cause
      });
    },
    'autoUpdate-update-available': () => {
      console.log('An update is available');
      dispatch({
        type: CHECK_FOR_UPDATES_FOUND_UPDATE
      });
      dispatch(startAutoUpdate());
    },
    'autoUpdate-update-not-available': () => {
      console.log('An update is not available');
      dispatch({
        type: CHECK_FOR_UPDATES_NO_UPDATES
      });
    },
    'autoUpdate-update-downloaded': () => {
      console.log('An update downloaded');
      dispatch({
        type: UPDATE_DOWNLOAD_SUCCESS
      });
    }
  };
  _.forEach(listeners, (listenerFunction, listenerName) => {
    ipcRenderer.removeAllListeners(listenerName);
    ipcRenderer.on(listenerName, listenerFunction);
  });
  ipcRenderer.send('autoUpdate-initialize');

  dispatch({
    type: CHECK_FOR_UPDATES_BEGIN
  });
};
