import CacheableDataObject from '../CacheableDataObject';
import MapHelper from '../MapHelper';
import MeleeCharacter from './MeleeCharacter';
import SlippiStock from './SlippiStock';

export default class SlippiPlayer extends CacheableDataObject {

	beforeConstruct() {
		this.stocks = new Map();
		this.actions = {};
		this.overall = {};
		this.conversions = [];
		this.character = null;
	}

	addActions(actions) {
		for (const action of actions) {
			if (action.playerIndex === this.playerIndex) {
				this.actions = action;
			}
		}
	}

	getNameTag() {
		const playerTypeStr = this.type === 1 ? 'CPU' : 'Player';
		const portName = `${playerTypeStr} ${this.port}`;

		const netplayName = this.netplayName;
		const nameTag = this.nametag;

		if (netplayName === 'Player') {
			if(nameTag) {
				return `${nameTag} (${netplayName})`;
			}
			return nameTag || netplayName || portName;
		}
		return netplayName || nameTag || portName;
	}

	addConversions(conversions) {
		for (const conversion of conversions) {
			if (conversion.playerIndex === this.playerIndex) {
				this.conversions.push(conversion);
			}
		}
	}

	addOverall(overalls) {
		for (const overall of overalls) {
			if (overall.playerIndex === this.playerIndex) {
				this.overall = overall;
			}
		}
	}

	addStocks(matchStockList) {
		const stockList = new Map();
		for (const stock of matchStockList) {
			if (stock.playerIndex === this.playerIndex) {
				stockList.set(stock.count, stock);
				stock.player = this;
			}
		}
		this.stocks = stockList;
		for (let i = 1; i < this.startStocks; i++) {
			if (this.stocks.get(i)) {
				continue;
			}
			const stock = SlippiStock.create({ count: i });
			stock.player = this;
			this.stocks.set(i, stock);
		}
		MapHelper.inPlaceSort(stockList, ([_, stock1], [__, stock2]) => {
			return stock1.count > stock2.count ? 1 : -1;
		});
		this.stocksRemaining = 0;
		for (const [i, stock] of this.stocks) {
			if (stock.endFrame.seconds() === null) {
				this.stocksRemaining += 1;
			}
		}
	}

	stockIcon() {
		if (!this.character) {
			return null;
		}
		return this.character.getStockIcon();
	}

	getLadderStocks() {
		const stocks = {
			detail: [],
			stock_icon: this.stockIcon()
		};
		for (const [number, stock] of this.stocks) {
			stocks.detail.push(
				stock.convertToLadderStock()
			);
		}
		return stocks;
	}
}
SlippiPlayer.prototype.dataLocationParsers = {
	characterId(player, data) {
		player.character = MeleeCharacter.retrieve(data.characterId, data.characterColor);
		player.characterId = data.characterId;
	},
	character(player, data) {
		// just ignore this?
	}
};