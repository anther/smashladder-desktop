import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import slugify from '../../utils/slugify';

class Tab extends PureComponent {
	static propTypes = {
		activeTab: PropTypes.string.isRequired,
		label: PropTypes.string.isRequired
	};

	constructor(props) {
		super(props);
		this.labelSlug = slugify(props.label);

		this.linkClick = this.linkClick.bind(this);
	}


	linkClick(event) {
		const { onTabClick } = this.props;
		event.preventDefault();
		if (onTabClick) {
			onTabClick(event.target.dataset.label);
		}
	}

	componentDidUpdate(prevProps) {
		const { tabsInstance, index, label, activeTab } = this.props;
		if (activeTab !== prevProps.activeTab && activeTab === this.labelSlug) {
			tabsInstance.select(this.labelSlug);
		}
	}

	render() {
		const {
			labelSlug,
			onClick,
			props: {
				activeTab,
				label
			}
		} = this;

		const isActive = activeTab === this.labelSlug;
		return (
			<li
				className='tab'
			>
				<a
					className={`${isActive ? 'active' : ''} clickable`}
					onClick={this.linkClick}
					data-label={labelSlug}
				>
					{label}
				</a>
			</li>
		);
	}
}

export default Tab;