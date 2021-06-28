import uiManager from 'fontoxml-modular-ui/src/uiManager';

import NodesBrowserModal from './ui/NodesBrowserModal';

export default function install(): void {
	uiManager.registerReactComponent('NodesBrowserModal', NodesBrowserModal);
}
