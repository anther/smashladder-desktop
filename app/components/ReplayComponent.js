import React, {Component} from "react";
import {shell} from 'electron';
import Button from "./elements/Button";
import HtmlClassList from "../utils/HtmlClassList";

export default class ReplayComponent extends Component {
    constructor(props) {
        super(props);
        this.onReplayViewClick = this.replayViewClick.bind(this);
        this.onOpenInExplorer = this.openInExplorer.bind(this);
        this.onUploadReplayClick = this.uploadReplay.bind(this);
        this.onDeleteButtonClick = this.deleteButtonClick.bind(this);
        this.onCancelDeleteClick = this.cancelDeleteClick.bind(this);
        this.onDeleteConfirmClick = this.deleteConfirmClick.bind(this);
        this.onDetailsClick = this.detailsClick.bind(this);

        this.state = {
            deleteQuestion: false,
            deleting: false,
        };
    }

    detailsClick() {
        this.props.viewReplayDetails(this.props.replay);
    }

    deleteConfirmClick() {
        this.setState({
            deleting: true
        });
        this.props.deleteReplay(this.props.replay.filePath);
    }

    deleteButtonClick() {
        this.setState({
            deleteQuestion: true
        });
    }

    cancelDeleteClick() {
        this.setState({
            deleteQuestion: false
        });
    }

    uploadReplay() {
        const {replay} = this.props;
        replay.ignoreNewnessRestriction = true;
        this.props.checkReplay(this.props.replay.id, 'manual');
    }

    openInExplorer() {
        shell.showItemInFolder(this.props.replay.filePath);
    }

    replayViewClick() {
        const {launchReplay, replay, slippiBuild} = this.props;

        launchReplay({
            replay: replay,
        });
    }

    getReplayDisplayString() {
        const {replay, launchedReplay, launchingReplay} = this.props;
        if (replay.id === launchingReplay) {
            return 'Launching...'
        }
        if (replay.id === launchedReplay) {
            return 'Restart?';
        }

        return 'Launch';

    }

    renderElement(title, value) {
        if (this.props.shortSummary) {
            return null;
        }
        return (
            <div className='stat'>
                <span className='title'>{title}</span>
                <span className='value'>{String(value)}</span>
            </div>
        )
    }


    render() {
        const {
            replay,
            meleeIsoPath,
            detailed,
            settingMeleeIsoPath,
            launchingReplay
        } = this.props;
        const {deleteQuestion} = this.state;
        const stage = replay.getStage();
        const stats = replay.getStats(); // Currently used to fetch detailed stats
        return (
            <React.Fragment>
                <div className='replay_content'>
                    {detailed &&
                        <Button
                            onClick={this.onDetailsClick}
                            className='back_button btn-small'
                        >Back</Button>
                    }
                    <div className='game_data'>
                        <div className='stocks'>
                            {replay.getPlayers().map((player, index) => (
                                <div className='player' key={index}>
                                    <StocksComponent
                                        stocks={player.getLadderStocks()}
                                        showSelfDestructs
                                    />
                                    {detailed &&
                                    <div className='detailed_stats'>
                                        {this.renderElement('Kills', player.overall.killCount)}
                                        {this.renderElement('Openings Per Kill', player.overall.openingsPerKill.ratio ? player.overall.openingsPerKill.ratio.toFixed(1) : 'N/A')}
                                        {this.renderElement('Total Damage', `${player.overall.totalDamage ? player.overall.totalDamage.toFixed(1) : 0}%`)}
                                        {this.renderElement('Wavelands', player.actions.wavelandCount)}
                                        {this.renderElement('Wavedashes', player.actions.wavedashCount)}
                                        {this.renderElement('DashDances', player.actions.dashDanceCount)}
                                    </div>
                                    }
                                </div>
                            ))}
                        </div>
                        <div className='details'>
                            {stage &&
                            <div className='stage'>
                                <img alt={stage.name} src={stage.imageUrl()}/>
                            </div>
                            }
                            <div className='match_time'>
                                {replay.getMatchTime() &&
                                    <span>{replay.getMatchTime()}</span>
                                }
                                {!replay.getMatchTime() &&
                                    <div>
                                        <div className='error'>Game Unreadable</div>
                                        <div className='error_reason'>Dolphin Closed Before Match Ended?</div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    <div className='footer'>
                        <div className='file_data'>
                            <span className='when'>
                                {replay.getFileDate() ? replay.getFileDate().calendar() : ''}
                            </span>

                            <div className='file_name_holder'>
                                <a onClick={this.onOpenInExplorer} className='file_name'>
                                    {replay.getName()}
                                </a>
                            </div>
                        </div>
                        <div className='action_buttons'>
                            <div className='main_buttons'>
                                {deleteQuestion &&
                                <React.Fragment>
                                    <h6 className='title'>Delete?</h6>
                                    <div className='main_buttons'>
                                        <div className='input-field'>
                                            <Button
                                                disabled={this.state.deleting}
                                                onClick={this.onDeleteConfirmClick}
                                                className='error_button btn-small'>Yes</Button>
                                        </div>
                                        <div className='input-field'>
                                            <Button
                                                disabled={this.state.deleting}
                                                onClick={this.onCancelDeleteClick}
                                                className='btn-small'>No</Button>
                                        </div>
                                    </div>
                                </React.Fragment>
                                }

                                {!deleteQuestion &&
                                <React.Fragment>
                                    <div className='input-field'>
                                        <Button
                                            disabled={settingMeleeIsoPath || launchingReplay}
                                            onClick={this.onReplayViewClick}
                                            className={`btn-small ${meleeIsoPath ? 'set no_check' : 'not_set no_check'}`}>
                                            {launchingReplay &&
                                                <span>...</span>
                                            }
                                            {!launchingReplay &&
                                                <i className='fa fa-caret-right'/>
                                            }
                                        </Button>
                                    </div>
                                    {(replay.isReadable()) &&
                                    <div className='input-field'>
                                        <Button
                                            onClick={this.onDetailsClick}
                                            className='btn-small btn-flat'>
                                            <i className='fa fa-info-circle'/>
                                        </Button>
                                    </div>
                                    }

                                    {false &&
                                    <div className='input-field'>
                                        <Button onClick={this.onUploadReplayClick}>
                                            Upload Replay
                                        </Button>
                                    </div>
                                    }
                                    <div className='input-field'>
                                        <Button
                                            onClick={this.onDeleteButtonClick}
                                            className='btn-small error_button'>
                                            <i className='fa fa-trash'/>
                                        </Button>
                                    </div>

                                </React.Fragment>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

class StocksComponent extends React.Component {

    render() {
        const stocks = this.props.stocks;
        if (!stocks || !stocks.stock_icon || !stocks.detail) {
            return null;
        }
        const showDamage = this.props.showDamage === undefined ? true : this.props.showDamage;
        const showUpTo = this.props.showUpToStock || 99;
        const showDeaths = this.props.showDeaths === undefined ? true : this.props.showDeaths;
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
                    isSelfDestruct={this.props.showSelfDestructs && stock.is_self_destruct}
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
            <div className="stocks has_stocks">
                {stockComponents}
            </div>
        )
    }
}

class StockComponent extends React.Component {
    render() {
        const {stock, showDamage, stockIconUrl, isSelfDestruct, showDeaths} = this.props;
        const iconUrl = this.props.stockIconUrl;
        const classes = new HtmlClassList();

        classes.add('stock_icon');
        if (showDeaths && (stock.time_lost !== null && stock.time_lost !== undefined)) {
            classes.add('dead');
        }
        if (isSelfDestruct) {
            classes.add('self_destructed');
        }
        const displayDamageConditions = showDamage && (stock.time_started !== null);

        return (
            <span data-number={stock.stock_number} className={classes.toString()}>
				<img
                    src={iconUrl}
                />
                {displayDamageConditions &&
                <span className='damage active'>{Number.parseInt(stock.damage_received, 10)}</span>
                }
			</span>
        );
    }
}

export {StocksComponent};