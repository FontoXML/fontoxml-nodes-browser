define([
	'fontoxml-modular-ui/uiManager',

	'./ui/NodesBrowserModal.jsx'
], function (
	uiManager,

	NodesBrowserModal
) {
	'use strict';

	return function install () {
		uiManager.registerReactComponent('NodesBrowserModal', NodesBrowserModal);
	};
});
