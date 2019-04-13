import React, { Component } from 'react';
import Button from './Button';
import ProgressIndeterminate from './ProgressIndeterminate';

export default class SetBuildPathButton extends Component {
	constructor(props) {
		super(props);

		this.onSetBuildPathClick = this.setBuildPathClick.bind(this);
		this.ref = React.createRef();
	}

	componentDidMount() {
		const { build } = this.props;
		if (!build.path) {
			M.Tooltip.init(this.ref.current);
		}
	}

	setBuildPathClick() {
		const { build } = this.props;
		console.log('hello?');
		this.props.promptToSetBuildPath(build);
	}

	render() {
		const { buildSettingPath, buildOpen, downloading, build, disabled } = this.props;
		const extraProps = {};
		if (!build.path) {
			extraProps['data-tooltip'] = 'Use a Dolphin that you already have on your System';
			extraProps['data-position'] = 'top';
			extraProps.className = 'btn-small not_set no_check';
		}
		else {
			extraProps.className = 'btn-small set';
			extraProps.title = build.path;
		}
		return (
			<span className={build.path ? 'has_path' : 'no_path'}>
				<Button
					disabled={buildSettingPath || buildOpen || !!downloading || disabled}
					onClick={this.onSetBuildPathClick}
					{...extraProps}
				>
					{buildSettingPath === build.id &&
					<ProgressIndeterminate/>
					}
					{build.path ? 'Path Set' : 'Set Path'}
				</Button>
			</span>
		);
	}
}
