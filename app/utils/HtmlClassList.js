export default class HtmlClassList {
	constructor(initialClassList) {
		this.classes = new Set();
		this.finalValue = '';
		if (initialClassList) {
			this.addClass(initialClassList);
		}
	}

	hasClass(entry) {
		return this.classes.has(entry);
	}

	addClass(entry) {
		const split = entry.split(' ');
		if(split.length > 1){
			split.forEach((className) => {
				this.addClass(className);
			});
			return this;
		}
		this.classes.add(entry);
		return this;
	}

	removeClass(entry) {
		this.classes.delete(entry);
		return this;
	}

	toString() {
		return Array.from(this.classes.keys()).join(' ');
	}

	getFinalValue() {
		return this.finalValue;
	}

	keys() {
		return this.classes.keys();
	}

	[Symbol.iterator]() {
		return this.classes.entries();
	}
}
HtmlClassList.prototype.push = HtmlClassList.prototype.addClass;
HtmlClassList.prototype.add = HtmlClassList.prototype.addClass;
HtmlClassList.prototype.set = HtmlClassList.prototype.addClass;
HtmlClassList.prototype.delete = HtmlClassList.prototype.removeClass;