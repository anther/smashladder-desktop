import React, { Component } from 'react';
import Files from '../../utils/Files';
import Button from './Button';

export default class RemoveBuildPathsButton extends Component {
	constructor(props) {
		super(props);
		this.slippiIconRef = React.createRef();

		this.onUnsetBuildPathClick = this.unsetBuildPathClick.bind(this);
	}

	componentDidMount() {
		M.Tooltip.init(this.slippiIconRef.current);
	}

	unsetBuildPathClick() {
		this.props.beginUnsettingBuildPath();
	}

	render() {
		const { build, buildOpen } = this.props;
		return (
			<div className="remove_build_path">
				{build.getSlippiPath() && (
					<img
						ref={this.slippiIconRef}
						data-position="top"
						data-tooltip="This Build Has Replay Capabilities"
						className="build_image"
						alt="Has Slippi"
						src={Files.createApplicationPath('./external/dolphin/slippi/36x36.png')}
					/>
				)}
				<Button
					disabled={buildOpen}
					onClick={this.onUnsetBuildPathClick}
					className="btn-small not_set remove_path"
				/>
			</div>
		);
	}
}
