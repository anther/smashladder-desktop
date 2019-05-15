import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Tab from './Tab';
import slugify from '../../utils/slugify';

export default class Tabs extends Component {
	static checkUrlHashses = true;

	static propTypes = {
		children: PropTypes.instanceOf(Array).isRequired,
		onTabChange: PropTypes.func,
		onTabClick: PropTypes.func,
		activeTab: PropTypes.string
	};

	static defaultProps = {
		activeTab: null,
		onTabChange: null,
		onTabClick: null
	};

	constructor(props) {
		super(props);
		const { children, activeTab } = this.props;

		this.tabsRef = React.createRef();

		this.state = {};
		let childUrlHashMatch = null;

		let currentUrlHash = null;
		if (activeTab) {
			currentUrlHash = activeTab;
		} else if (Tabs.checkUrlHashses) {
			currentUrlHash = null;
			if (window.location.hash) {
				currentUrlHash = window.location.hash.substring(1);
				// Fragment exists
			} else {
				// Fragment doesn't exist
			}
		}
		if (currentUrlHash) {
			children.forEach((child) => {
				if (!child) {
					return;
				}
				if (slugify(child.props.label) === currentUrlHash) {
					childUrlHashMatch = child.props.label;
				}
			});
		}
		if (childUrlHashMatch === null) {
			childUrlHashMatch = children[0].props.label;
		}

		this.state = {
			selectedTab: slugify(childUrlHashMatch)
		};

		this.onTabClick = this.onTabClick.bind(this);
	}

	onTabClick(tab) {
		const { onTabClick, onTabChange } = this.props;
		this.tabsInstance.select(tab);
		this.setState({
			selectedTab: tab
		});
		if (onTabClick) {
			onTabClick(tab);
		}
		if (onTabChange && tab !== slugify(this.state.selectedTab)) {
			console.error('triggered change!?');
			this.props.onTabChange(tab);
		}
	}

	static getDerivedStateFromProps(currentProps, currentState) {
		const activeTab = currentProps.activeTab;
		if (!activeTab) {
			return null;
		}
		const selectedTab = slugify(activeTab);
		if (currentState.selectedTab !== selectedTab) {
			return {
				selectedTab
			};
		}
		return null;
	}

	componentDidMount() {
		Tabs.checkUrlHashses = false;
		this.tabsInstance = M.Tabs.init(this.tabsRef.current, {});
	}

	render() {
		const { children, activeTab } = this.props;
		const { selectedTab } = this.state;

		return (
			<React.Fragment>
				<div className="row">
					<ul
						ref={this.tabsRef}
						className="tabs z-depth-1">
						{children.map((tab, index) => {
							if (!tab) {
								return null;
							}
							const { label } = tab.props;
							return (
								<Tab
									tabsInstance={this.tabsInstance}
									onTabClick={this.onTabClick}
									activeTab={activeTab || selectedTab}
									index={index}
									key={label}
									label={label}
								/>
							);
						})}
					</ul>
				</div>
				<div className="tab-content">
					{children.map((child) => {
						if (!child) {
							return null;
						}
						const childClass = child.props.className ? child.props.className : '';
						const isSelected = selectedTab === slugify(child.props.label);
						return (
							<div
								className={`${childClass} ${isSelected ? 'active' : ''}`}
								key={child.props.label}
								id={slugify(child.props.label)}>
								{isSelected &&
								child.props.children
								}
							</div>
						);
					})}
				</div>
			</React.Fragment>
		);
	}
}