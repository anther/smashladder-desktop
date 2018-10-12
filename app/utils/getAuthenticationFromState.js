import { SmashLadderAuthentication } from './SmashLadderAuthentication';

export default function getAuthenticationFromState(getState) {
	const state = getState();
	return SmashLadderAuthentication.create({
		loginCode: state.login.loginCode,
		sessionId: state.login.sessionId,
		productionUrls: state.login.productionUrls
	});
}
