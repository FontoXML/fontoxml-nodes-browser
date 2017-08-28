define([
	'fontoxml-modular-ui/uiManager',

	'./ui/NodeBrowserModal.jsx'
], function (
	uiManager,

	NodeBrowserModal
) {
	'use strict';

	return function install () {
		uiManager.registerReactComponent('NodeBrowserModal', NodeBrowserModal);
	};
});
