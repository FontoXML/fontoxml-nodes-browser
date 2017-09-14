import PropTypes from 'prop-types';
import React, { Component } from 'react';

import caseConverter from 'fontoxml-utils/caseConverter';
import documentsManager from 'fontoxml-documents/documentsManager';
import domQuery from 'fontoxml-dom-utils/domQuery';
import evaluateXPathToNodes from 'fontoxml-selectors/evaluateXPathToNodes';
import evaluateXPathToString from 'fontoxml-selectors/evaluateXPathToString';
import getMarkupLabel from 'fontoxml-markup-documentation/getMarkupLabel';
import getNodeId from 'fontoxml-dom-identification/getNodeId';
import NodePreview from 'fontoxml-fx/NodePreview.jsx';
import readOnlyBlueprint from 'fontoxml-blueprints/readOnlyBlueprint';
import t from 'fontoxml-localization/t';

import {
	Button,
	Flex,
	Modal,
	ModalBody,
	ModalContent,
	ModalContentToolbar,
	ModalFooter,
	ModalHeader,
	SearchInput
} from 'fontoxml-vendor-fds/components';

import NodesList from './NodesList.jsx';

const createViewModelsForNodes = (linkableElementsQuery, labelQuery) =>
	documentsManager
		.getAllDocumentIds({ 'cap/operable': true })
		.reduce((displayedNodes, documentId) => {
			const documentNode = documentsManager.getDocumentNode(documentId);

			const nodes = evaluateXPathToNodes(
				linkableElementsQuery,
				documentNode,
				readOnlyBlueprint
			);

			return displayedNodes.concat(
				nodes.map(node => {
					// Used for searches
					const searchLabel = domQuery.getTextContent(node);

					let shortLabel = labelQuery
						? evaluateXPathToString(labelQuery, node, readOnlyBlueprint)
						: searchLabel;
					if (shortLabel === '') {
						shortLabel = t('(Empty element)');
					}

					const nodeId = getNodeId(node);

					return {
						documentId,
						markupLabel: caseConverter.uppercaseFirstLetter(
							getMarkupLabel(node) || node.nodeName
						),
						nodeId: nodeId,
						searchLabel,
						shortLabel,
						id: nodeId
					};
				})
			);
		}, []);

const searchInputContainerStyles = { maxWidth: '20rem', width: '100%' };

class NodesBrowserModal extends Component {
	static propTypes = {
		cancelModal: PropTypes.func.isRequired,
		data: PropTypes.shape({
			documentId: PropTypes.string,
			labelQuery: PropTypes.string,
			linkableElementsQuery: PropTypes.string.isRequired,
			modalPrimaryButtonLabel: PropTypes.string.isRequired,
			modalTitle: PropTypes.string.isRequired,
			nodeId: PropTypes.string
		}),
		submitModal: PropTypes.func.isRequired
	};

	initialNodes = createViewModelsForNodes(
		this.props.data.linkableElementsQuery,
		this.props.data.labelQuery
	);

	state = {
		displayedNodes: this.initialNodes,
		searchInput: '',
		selectedNode: this.initialNodes.find(node => node.nodeId === this.props.data.nodeId) || null
	};

	filterInitialNodes = searchInput =>
		this.initialNodes.filter(
			node =>
				node.markupLabel.toLowerCase().includes(searchInput.toLowerCase()) ||
				node.searchLabel.toLowerCase().includes(searchInput.toLowerCase())
		);

	handleSearchInputChange = searchInput =>
		this.setState({
			searchInput,
			displayedNodes:
				searchInput === '' ? this.initialNodes : this.filterInitialNodes(searchInput)
		});

	handleNodeListItemClick = selectedNode => this.setState({ selectedNode });

	handleSubmit = node =>
		this.props.submitModal({ nodeId: node.nodeId, documentId: node.documentId });

	handleSubmitButtonClick = () => this.handleSubmit(this.state.selectedNode);

	render() {
		const { displayedNodes, searchInput, selectedNode } = this.state;
		const { cancelModal, data: { modalPrimaryButtonLabel, modalTitle } } = this.props;

		return (
			<Modal size="m">
				<ModalHeader title={modalTitle} />

				<ModalBody>
					<ModalContent flexDirection="column">
						<ModalContentToolbar>
							<Flex applyCss={searchInputContainerStyles}>
								<SearchInput
									onChange={this.handleSearchInputChange}
									value={searchInput}
								/>
							</Flex>
						</ModalContentToolbar>

						<ModalContent>
							<ModalContent>
								<NodesList
									nodes={displayedNodes}
									onItemClick={this.handleNodeListItemClick}
									onItemDoubleClick={this.handleSubmit}
									searchInput={searchInput}
									selectedNode={selectedNode}
								/>
							</ModalContent>

							{selectedNode && (
								<ModalContent flexDirection="column" isScrollContainer>
									<NodePreview
										documentId={selectedNode.documentId}
										traversalRootNodeId={selectedNode.nodeId}
									/>
								</ModalContent>
							)}
						</ModalContent>
					</ModalContent>
				</ModalBody>

				<ModalFooter>
					<Button label={t('Cancel')} onClick={cancelModal} />

					<Button
						type="primary"
						label={modalPrimaryButtonLabel}
						isDisabled={!selectedNode}
						onClick={this.handleSubmitButtonClick}
					/>
				</ModalFooter>
			</Modal>
		);
	}
}

export default NodesBrowserModal;
