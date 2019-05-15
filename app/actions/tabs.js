export const CHANGE_TAB = 'CHANGE_TAB';

export const changeTab = (newTab) => {
	console.log('waht is new tab', newTab);
	return {
		type: CHANGE_TAB,
		payload: newTab
	};
};