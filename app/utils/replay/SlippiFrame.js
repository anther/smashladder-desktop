import moment from 'moment';

export default class SmashFrame {
	constructor(frame) {
		if (frame === null) {
			this.frame = null;
		} else {
			this.frame = Number.parseInt(frame, 10);
		}
	}

	static createFromFameNumber(frame) {
		return Number.isInteger(frame) ? new SmashFrame(frame) : new SmashFrame(null);
	}

	isSameFrameAs(other) {
		if (other.frame === this.frame) {
			return true;
		}
		return false;
	}

	isFirstFrame() {
		return this.frame === -123;
	}

	seconds() {
		if (this.frame === null) {
			return null;
		}
		return Math.ceil(this.frame / 60);
	}

	asTime() {
		if (this.frame === null) {
			return null;
		}
		return moment()
			.startOf('day')
			.seconds(this.seconds())
			.format('H:mm:ss');
	}
}
