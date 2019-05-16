import uiManager from 'fontoxml-modular-ui/src/uiManager.js';
import NodesBrowserModal from './ui/NodesBrowserModal.jsx';

export default function install() {
	uiManager.registerReactComponent('NodesBrowserModal', NodesBrowserModal);
}
