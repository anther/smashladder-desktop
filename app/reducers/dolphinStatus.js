import { DOLPHIN_STATUS_SEND_BEGIN } from '../actions/dolphinStatus';
import { BUILD_CLOSED } from '../actions/builds';

const initialState = {
  dolphinPlayers: {}
};

export default (state = initialState, action) => {
  switch (action.type) {
    case DOLPHIN_STATUS_SEND_BEGIN:
      return {
        ...state,
        dolphinPlayers: { ...action.payload }
      };
    case BUILD_CLOSED:
      return {
        ...state,
        dolphinPlayers: {}
      };
    default:
      return state;
  }
};
