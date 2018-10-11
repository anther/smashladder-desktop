export default class DolphinResponse {
	static ahkResponse(message) {
		if (!message) {
			return {};
		}
		var action = message.action;
		var value = message.message;
		// var action = message.substring(message.indexOf("~")+1, message.lastIndexOf("~"));
		// var value = message.substring(message.indexOf("<")+1, message.lastIndexOf(">"));

		return {
			action,
			value,
			original: message
		};
	}

	static splitMessage(message) {
		if (!message) {
			return {};
		}
		if (typeof message === 'string') {

		}
		else if (typeof message !== 'string' && message.toString) {
			message = message.toString();
		}
		else {
			return { action: null, error: 'Could not use string!' };
		}
		var time = message.substring(message.indexOf(':') + 1, message.lastIndexOf(':'));
		var afterTime = message.substring(message.lastIndexOf(':') + 1, message.length);
		var splitMessage = afterTime.split(' ');
		var lastArgument = splitMessage.pop();


		var action;
		action = splitMessage.join(' ');
		action = action.trim();
		action = action.replace(' ', '_');
		action = action.toLowerCase();

		return {
			action: action,
			time: time,
			value: lastArgument.trim(),
			original: message
		};

		// dolphinMessage.includes("Host Code ")
	}

	static parse(message) {
		var parsed = DolphinResponse.splitMessage(message);
		if (parsed.action) {
			return parsed;
		}
		else {
			return {
				action: null,
				value: message.toString()
			};
		}
	}

}