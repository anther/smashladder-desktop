import {
  CHECK_FOR_UPDATES_BEGIN,
  CHECK_FOR_UPDATES_FAIL,
  CHECK_FOR_UPDATES_FOUND_UPDATE,
  CHECK_FOR_UPDATES_NO_UPDATES,
  UPDATE_DOWNLOAD_BEGIN,
  UPDATE_DOWNLOAD_FAIL,
  UPDATE_DOWNLOAD_SUCCESS
} from '../actions/autoUpdates';

export const activeUpdateStates = {
  DOWNLOADING: 'DOWNLOADING',
  DOWNLOADED: 'DOWNLOADED'
};
const initialState = {
  autoUpdateError: null,
  updateAvailable: null,
  activeUpdate: null,
  checkingForUpdates: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CHECK_FOR_UPDATES_BEGIN:
      return {
        ...state,
        checkingForUpdates: true,
        autoUpdateError: null
      };
    case CHECK_FOR_UPDATES_FAIL:
      return {
        ...state,
        checkingForUpdates: false,
        autoUpdateError: action.payload
      };
    case CHECK_FOR_UPDATES_FOUND_UPDATE:
      return {
        ...state,
        checkingForUpdates: false,
        autoUpdateError: null,
        updateAvailable: true
      };
    case CHECK_FOR_UPDATES_NO_UPDATES:
      return {
        ...state,
        checkingForUpdates: false,
        autoUpdateError: null,
        updateAvailable: false
      };
    case UPDATE_DOWNLOAD_BEGIN:
      return {
        ...state,
        autoUpdateError: null,
        activeUpdate: activeUpdateStates.DOWNLOADING
      };
    case UPDATE_DOWNLOAD_SUCCESS:
      return {
        ...state,
        autoUpdateError: null,
        activeUpdate: activeUpdateStates.DOWNLOADED
      };
    case UPDATE_DOWNLOAD_FAIL:
      return {
        ...state,
        autoUpdateError: action.payload,
        activeUpdate: null
      };
    default:
      return state;
  }
};
