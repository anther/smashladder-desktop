import electronSettings from 'electron-settings';
import {
	CHANGE_TAB
} from '../actions/tabs';

const initialState = {
	currentTab: 'home',
	currentStep: electronSettings.get('tabs.currentStep', 0)
};
export default (state = initialState, action) => {
	switch (action.type) {
		case CHANGE_TAB:
			return {
				...state,
				currentTab: action.payload
			};
		default:
			return state;
	}
};