import React from 'react';

import FxTemplatedView from 'fontoxml-templated-views/FxTemplatedView.jsx';

const NodePreview = ({ node }) => (
	<FxTemplatedView
		documentId={node.documentId}
		flags={{ readonly: true }}
		mode="preview"
		overrideMode=""
		stylesheetName="content"
		traversalRootNodeId={node.nodeId}
		viewName="content-preview"
	/>
);

export default NodePreview;
