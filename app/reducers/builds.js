import { BUILDS_ACQUIRED,BUILDS_RETRIEVE,BUILDS_RETRIEVE_FAILED } from '../actions/builds';

import electronSettings from 'electron-settings';

const initialState = {
	builds: []
};

export default (state = initialState, action) =>{
	switch(action.type){
		case BUILDS_ACQUIRED:
		case BUILDS_RETRIEVE:
		case BUILDS_RETRIEVE_FAILED:
			const newState = {
				...state,
				...action.payload,
			};
			return newState;
		default:
			return state;
	}
}