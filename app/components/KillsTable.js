import _ from 'lodash';
import React, { Component } from 'react';

import * as moveUtils from '../utils/moves';
import * as animationUtils from '../utils/animations';
import * as timeUtils from '../utils/time';

const columnCount = 5;

const styles = {};

export default class KillsTable extends Component {
	props: {
		game: object,
		playerDisplay: object,
		playerIndex: number,
	};

	generateStockRow = (stock) => {
		let start = stock.startFrame.asTime();
		let end = <span className={styles['secondary-text']}>–</span>;

		let killedBy = <span className={styles['secondary-text']}>–</span>;
		let killedDirection = <span className={styles['secondary-text']}>–</span>;

		const percent = `${Math.trunc(stock.currentPercent)}%`;

		const isFirstFrame = stock.startFrame === timeUtils.frames.START_FRAME;
		if (isFirstFrame) {
			start = <span className={styles['secondary-text']}>–</span>;
		}

		if (stock.endFrame) {
			end = stock.endFrame.asTime();

			killedBy = this.renderKilledBy(stock);
			killedDirection = this.renderKilledDirection(stock);
		}

		const secondaryTextStyle = styles['secondary-text'];
		return (
			<tr key={`${stock.playerIndex}-stock-${stock.startFrame.count}`}>
				<td className={secondaryTextStyle} collapsing>{start}</td>
				<td className={secondaryTextStyle} collapsing>{end}</td>
				<td>{killedBy}</td>
				<td>{killedDirection}</td>
				<td>{percent}</td>
			</tr>
		);
	};

	renderKilledBy(stock) {
		// Here we are going to grab the opponent's punishes and see if one of them was
		// responsible for ending this stock, if so show the kill move, otherwise assume SD
		const stats = this.props.game.getStats();
		const punishes = _.get(stats, 'conversions') || [];
		const punishesByPlayer = _.groupBy(punishes, 'playerIndex');
		const playerPunishes = punishesByPlayer[this.props.playerIndex] || [];

		// Only get punishes that killed
		const killingPunishes = _.filter(playerPunishes, 'didKill');
		const killingPunishesByEndFrame = _.keyBy(killingPunishes, 'endFrame');
		const punishThatEndedStock = killingPunishesByEndFrame[stock.endFrame.frame];

		if (!punishThatEndedStock) {
			return <span className={styles['secondary-text']}>Self Destruct</span>;
		}

		const lastMove = _.last(punishThatEndedStock.moves);
		return moveUtils.getMoveName(lastMove.moveId);
	}

	renderKilledDirection(stock) {
		const killedDirection = animationUtils.getDeathDirection(stock.deathAnimation);

		return (
			<i className={`fa fa-arrow-${killedDirection}`}/>
		);
	}

	renderHeaderPlayer() {
		// TODO: Make generating the player display better
		return (
			<tr>
				<td>
					{this.props.playerDisplay}
				</td>
			</tr>
		);
	}

	renderHeaderColumns() {
		return (
			<tr>
				<th>Start</th>
				<th>End</th>
				<th>Kill Move</th>
				<th>Direction</th>
				<th>Percent</th>
			</tr>
		);
	}

	renderStocksRows() {
		const stats = this.props.game.getStats() || {};
		const stocks = _.get(stats, 'stocks') || [];
		const stocksByOpponent = _.groupBy(stocks, 'opponentIndex');
		const opponentStocks = stocksByOpponent[this.props.playerIndex] || [];

		return opponentStocks.map(this.generateStockRow);
	}

	render() {
		return (
			<table
				className={styles['stats-table']}
				celled
				inverted
				selectable
			>
				<thead>
				{this.renderHeaderPlayer()}
				{this.renderHeaderColumns()}
				</thead>

				<tbody>
				{this.renderStocksRows()}
				</tbody>
			</table>
		);
	}
}
