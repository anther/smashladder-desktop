import React, {Component} from 'react';
import Button from "./elements/Button";


export default class FilePaths extends Component
{

	render(){
		return null;
		return(
			<div className='file_paths'>
				<Button onClick={this.props.updateRomPath}>Set Rom Path</Button>
				<input type='checkbox' checked={this.props.searchSubdirectories} />
			</div>
		)
	}
}