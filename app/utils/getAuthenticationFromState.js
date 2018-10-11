import { SmashLadderAuthentication } from './SmashLadderAuthentication';

export default function getAuthenticationFromState(getState) {
	const state = getState();
	return SmashLadderAuthentication.create({
		loginCode: state.login.loginCode,
		session_id: state.login.sessionId,
		productionUrls: state.login.productionUrls
	});
}
