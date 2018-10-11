import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { remote } from 'electron';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.scss';
import 'materialize-css/dist/js/materialize';

const store = configureStore();

render(
	<AppContainer>
		<Root store={store} history={history}/>
	</AppContainer>,
	document.getElementById('root')
);

if (module.hot) {
	module.hot.accept('./containers/Root', () => {
		const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
		render(
			<AppContainer>
				<NextRoot store={store} history={history}/>
			</AppContainer>,
			document.getElementById('root')
		);
	});
}

const InputMenu = remote.Menu.buildFromTemplate([
	{
		label: 'Undo',
		role: 'undo'
	},
	{
		label: 'Redo',
		role: 'redo'
	},
	{
		type: 'separator'
	},
	{
		label: 'Cut',
		role: 'cut'
	},
	{
		label: 'Copy',
		role: 'copy'
	},
	{
		label: 'Paste',
		role: 'paste'
	},
	{
		type: 'separator'
	},
	{
		label: 'Select all',
		role: 'selectall'
	}
]);

console.log('adding context menu');
document.body.addEventListener('contextmenu', e => {
	e.preventDefault();
	e.stopPropagation();

	let node = e.target;

	while (node) {
		if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
			InputMenu.popup(remote.getCurrentWindow());
			break;
		}
		node = node.parentNode;
	}
});
