/* eslint-disable no-restricted-syntax */
import React, { Component } from 'react';
import StockComponent from './StockComponent';

export default class StocksComponent extends Component {

	render() {
		const { stocks, showSelfDestructs, showDeaths, showDamage, showUpToStock } = this.props;
		if (!stocks || !stocks.stock_icon || !stocks.detail) {
			return null;
		}
		const showDamageReally = showDamage === undefined ? true : showDamage;
		const showUpTo = showUpToStock || 99;
		const showDeathsReally = showDeaths === undefined ? true : showDeaths;


		let numberShown = 0;
		const stockComponents = [];
		for (const stock of stocks.detail) {
			stockComponents.push(
				<StockComponent
					stockIconUrl={stocks.stock_icon}
					stock={stock}
					key={stock.stock_number}
					showDamage={showDamageReally}
					showDeaths={showDeathsReally}
					isSelfDestruct={showSelfDestructs && stock.is_self_destruct}
				/>
			);
			numberShown++;
			if (numberShown >= showUpTo) {
				break;
			}
		}
		if (!stockComponents.length) {
			return null;
		}
		return (
			<div className="stocks has_stocks">{stockComponents}</div>
		);
	}
}