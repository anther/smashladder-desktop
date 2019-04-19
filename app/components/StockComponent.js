import React, { Component } from 'react';
import HtmlClassList from '../utils/HtmlClassList';

export default class StockComponent extends Component {
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
			<span className={`stock_icon ${classes.toString()}`}>
				<img src={iconUrl} />
				{displayDamageConditions && (
					<span className="damage active">
						{Number.parseInt(stock.damage_received, 10)}
					</span>
				)}
			</span>
		);
	}
}