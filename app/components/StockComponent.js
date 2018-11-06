import React, { Component } from 'react';
import HtmlClassList from '../utils/HtmlClassList';

export default class StockComponent extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		const {
			stock,
			showDamage,
			stockIconUrl,
			isSelfDestruct,
			showDeaths
		} = this.props;
		const iconUrl = stockIconUrl;
		const classes = new HtmlClassList();

		classes.add('stock_icon');
		if (
			showDeaths &&
			(stock.time_lost !== null && stock.time_lost !== undefined)
		) {
			classes.add('dead');
		}
		if (isSelfDestruct) {
			classes.add('self_destructed');
		}
		const displayDamageConditions = showDamage && stock.time_started !== null;

		return (
			<span data-number={stock.stock_number} className={classes.toString()}>
				<img src={iconUrl}/>
				{displayDamageConditions && (
					<span className="damage active">
						{Number.parseInt(stock.damage_received, 10)}
					</span>
				)}
			</span>
		);
	}
}