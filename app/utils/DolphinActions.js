import {DolphinPlayer} from './DolphinPlayer';

export default class DolphinActions
{
	static call(name, build, message) {
		if (DolphinActions.isCallable(name)) {
			return DolphinActions.callableActions[name](build, message);
		}
		else {
			throw 'Invalid Call to ' + name;
		}
	}

	static isCallable(name) {
		return typeof DolphinActions.callableActions[name] === "function";
	}

}
DolphinActions.lastHostCode = null;
DolphinActions.callableActions = {
	host_code: function(build, value){
		if(build && build.ignoreNextHostMessage)
		{
			console.log('Ignoring host because attempting to join!');
			build.ignoreNextHost(false);
			return;
		}
		if(value == DolphinActions.lastHostCode)
		{
			return null;
		}
		DolphinActions.lastHostCode = value;
		return String(value).padStart(8, '0');
	},

	joining: function(build, value){
		build.ignoreNextHost(true);
	},

	player_list_info: function(build, value){
		if(false && constants.debuggingMatchInputs)
		{
			value = `Antherpzy[1] : 727(0b00f1f) Win | 1------- |
Ping: 53ms
Status: ready
[2] : 727(0b00f1f) Win | -2------- |
Ping: 23ms
Status: ready
`;
		}
		return DolphinPlayer.parseDolphinPlayerList(value);
	},

	dolphin: function(value){
		console.log('Yay');
	},
	setup_netplay_host_failed: () => (null),
	setup_netplay_host_failed_empty_list: () => (null),
};