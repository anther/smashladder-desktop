import { UPDATE_ROM_PATH, UPDATE_SEARCH_SUBDIRECTORIES } from "../actions/filePaths";


const initialState = {
	romPath: null,
	searchSubdirectories: null,
};

export default (state = initialState, action) => {

	switch(action.type)
	{
		case UPDATE_ROM_PATH:
		case UPDATE_SEARCH_SUBDIRECTORIES:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
}