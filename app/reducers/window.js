import {
	WINDOW_FOCUS,
	WINDOW_BLUR,
	WINDOW_WATCH_INITIALIZE_SUCCESS
} from '../actions/window';

const initialState = {
	windowFocused: false,
	watchInitialized: false
};

export default (state = initialState, action) => {
	switch (action.type) {
		case WINDOW_WATCH_INITIALIZE_SUCCESS:
			return {
				...state,
				watchInitialized: true
			};
		case WINDOW_FOCUS:
			return {
				...state,
				windowFocused: true
			};
		case WINDOW_BLUR:
			return {
				...state,
				windowFocused: false
			};
		default:
			return state;
	}
}