import StringManipulator from '../StringManipulator';

export default class MeleeCharacter {
	static retrieve(id){
		const name = MeleeCharacter.characters[id];
		if(name)
		{
			return MeleeCharacter.retrieveByName(name);
		}
		throw new Error(`not found ${id}`);
	}

	static retrieveCss(id){
		const name = MeleeCharacter.cssCharacters[id];
		if(name)
		{
			return MeleeCharacter.retrieveByName(name);
		}
		throw new Error(`not found ${id}`);
	}

	static retrieveByName(name){
		let found = null;
		if(MeleeCharacter.cached[name])
		{
			found = MeleeCharacter.cached[name];
			return found;
		}
		found = MeleeCharacter.cached[name] = new MeleeCharacter(name);
		return MeleeCharacter.cached[name];
	}

	stockIcon(number){
		if(!number)
		{
			number = 0;
		}
		return `./images/characters/melee/stocks/${StringManipulator.slugify(this.name.toLowerCase())}/${number}.png`;
	}

	constructor(name){
		this.name = name;
		this.url = `./images/characters/melee/${StringManipulator.slugify(this.name)}.png`;
	}

}

MeleeCharacter.cached = {};

MeleeCharacter.characters = {
	0: "Captain Falcon",
	1: "Donkey Kong",
	2: "Fox",
	3: "Mr. Game & Watch",
	4: "Kirby",
	5: "Bowser",
	6: "Link",
	7: "Luigi",
	8: "Mario",
	9: "Marth",
	10: "Mewtwo",
	11: "Ness",
	12: "Peach",
	13: "Pikachu",
	14: "Ice Climbers",
	15: "Jigglypuff",
	16: "Samus",
	17: "Yoshi",
	18: "Zelda",
	19: "Sheik",
	20: "Falco",
	21: "Young Link",
	22: "Dr. Mario",
	23: "Roy",
	24: "Pichu",
	25: "Ganondorf",
};
MeleeCharacter.cssCharacters = {
	0: "Dr. Mario",
	1: "Mario",
	2: "Luigi",
	3: "Bowser",
	4: "Peach",
	5: "Yoshi",
	6: "Donkey Kong",
	7: "Captain Falcon",
	8: "Ganondorf",
	9: "Falco",
	10: "Fox",
	11: "Ness",
	12: "Ice Climbers",
	13: "Kirby",
	14: "Samus",
	15: "Zelda",
	16: "Link",
	17: "Young Link",
	18: "Pichu",
	19: "Pikachu",
	20: "Jigglypuff",
	21: "Mewtwo",
	22: "Mr. Game & Watch",
	23: "Marth",
	24: "Roy",
}