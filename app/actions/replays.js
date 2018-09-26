export const CHECK_FOR_REPLAYS = 'CHECK_FOR_REPLAYS';

export const setCheckForReplays = (yes) => {
	return {
		type: CHECK_FOR_REPLAYS,
		payload: yes
	};
};