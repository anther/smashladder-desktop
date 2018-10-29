import React from 'react';
import StockComponent from './StockComponent';

export default class StocksComponent extends React.Component {
	render() {
		const { stocks } = this.props;
		if (!stocks || !stocks.stock_icon || !stocks.detail) {
			return null;
		}
		const showDamage =
			this.props.showDamage === undefined ? true : this.props.showDamage;
		const showUpTo = this.props.showUpToStock || 99;
		const showDeaths =
			this.props.showDeaths === undefined ? true : this.props.showDeaths;
		let numberShown = 0;
		const stockComponents = [];
		for (const stock of stocks.detail) {
			stockComponents.push(
				<StockComponent
					stockIconUrl={stocks.stock_icon}
					stock={stock}
					key={stock.stock_number}
					showDamage={showDamage}
					showDeaths={showDeaths}
					isSelfDestruct={
						this.props.showSelfDestructs && stock.is_self_destruct
					}
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
		return <div className="stocks has_stocks">{stockComponents}</div>;
	}
}