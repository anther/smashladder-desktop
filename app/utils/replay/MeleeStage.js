import Files from '../Files';

import StringManipulator from '../StringManipulator';

export default class MeleeStage {
	static retrieve(id) {
		if(!id) {
			return null;
		}
		const name = MeleeStage.stages[id].name;
		if(name) {
			if(cache[name]) {
				return cache[name];
			}
			return (cache[name] = new MeleeStage(id, name));
		}
		return null;
	}

	constructor(id, name) {
		this.id = id;
		this.name = name;
	}

	imageUrl() {
		if(this._imagePath) {
			return this._imagePath;
		}
		return (this._imagePath = Files.createApplicationPath(
			`./external/stages/melee/${StringManipulator.slugify(
				this.name.toLowerCase()
			)}.png`
		));
	}
}

const cache = {};
MeleeStage.stages = {
	2: {
		id: 2,
		name: 'Fountain of Dreams'
	},
	3: {
		id: 3,
		name: 'Pokémon Stadium'
	},
	4: {
		id: 4,
		name: 'Princess Peach\'s Castle'
	},
	5: {
		id: 5,
		name: 'Kongo Jungle'
	},
	6: {
		id: 6,
		name: 'Brinstar'
	},
	7: {
		id: 7,
		name: 'Corneria'
	},
	8: {
		id: 8,
		name: 'Yoshi\'s Story'
	},
	9: {
		id: 9,
		name: 'Onett'
	},
	10: {
		id: 10,
		name: 'Mute City'
	},
	11: {
		id: 11,
		name: 'Rainbow Cruise'
	},
	12: {
		id: 12,
		name: 'Jungle Japes'
	},
	13: {
		id: 13,
		name: 'Great Bay'
	},
	14: {
		id: 14,
		name: 'Hyrule Temple'
	},
	15: {
		id: 15,
		name: 'Brinstar Depths'
	},
	16: {
		id: 16,
		name: 'Yoshi\'s Island'
	},
	17: {
		id: 17,
		name: 'Green Greens'
	},
	18: {
		id: 18,
		name: 'Fourside'
	},
	19: {
		id: 19,
		name: 'Mushroom Kingdom I'
	},
	20: {
		id: 20,
		name: 'Mushroom Kingdom II'
	},
	22: {
		id: 22,
		name: 'Venom'
	},
	23: {
		id: 23,
		name: 'Poké Floats'
	},
	24: {
		id: 24,
		name: 'Big Blue'
	},
	25: {
		id: 25,
		name: 'Icicle Mountain'
	},
	26: {
		id: 26,
		name: 'Icetop'
	},
	27: {
		id: 27,
		name: 'Flat Zone'
	},
	28: {
		id: 28,
		name: 'Dream Land'
	},
	29: {
		id: 29,
		name: 'Yoshi\'s Island N64'
	},
	30: {
		id: 30,
		name: 'Kongo Jungle N64'
	},
	31: {
		id: 31,
		name: 'Battlefield'
	},
	32: {
		id: 32,
		name: 'Final Destination'
	}
};
