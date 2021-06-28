import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
	Button,
	Flex,
	Modal,
	ModalBody,
	ModalContent,
	ModalContentToolbar,
	ModalFooter,
	ModalHeader,
	SearchInput,
} from 'fds/components';
import documentsManager from 'fontoxml-documents/src/documentsManager';
import domQuery from 'fontoxml-dom-utils/src/domQuery';
import evaluateXPathToNodes from 'fontoxml-selectors/src/evaluateXPathToNodes';
import evaluateXPathToString from 'fontoxml-selectors/src/evaluateXPathToString';
import getNodeId from 'fontoxml-dom-identification/src/getNodeId';
import FxNodePreview from 'fontoxml-fx/src/FxNodePreview';
import operationsManager from 'fontoxml-operations/src/operationsManager';
import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
import t from 'fontoxml-localization/src/t';

import NodesList from './NodesList';

function upperCaseFirstLetter(input) {
	const firstCharacter = String.fromCodePoint(input.codePointAt(0));
	return firstCharacter.toUpperCase() + input.substr(firstCharacter.length);
}

const createViewModelsForNodes = (linkableElementsQuery) =>
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
				nodes.map((node) => {
					// Used for searches
					const searchLabel = domQuery.getTextContent(node);

					let shortLabel =
						evaluateXPathToString(
							'fonto:title-content(.)',
							node,
							readOnlyBlueprint
						) || searchLabel;
					if (shortLabel === '') {
						shortLabel = t('(Empty element)');
					}

					const nodeId = getNodeId(node);

					const markupLabel = upperCaseFirstLetter(
						evaluateXPathToString(
							'fonto:markup-label(.)',
							node,
							readOnlyBlueprint
						) || node.nodeName
					);

					return {
						documentId,
						markupLabel,
						nodeId: nodeId,
						searchLabel,
						shortLabel,
						id: nodeId,
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
			insertOperationName: PropTypes.string,
			linkableElementsQuery: PropTypes.string.isRequired,
			modalIcon: PropTypes.string,
			modalPrimaryButtonLabel: PropTypes.string.isRequired,
			modalTitle: PropTypes.string.isRequired,
			nodeId: PropTypes.string,
		}),
		submitModal: PropTypes.func.isRequired,
	};

	initialNodes = createViewModelsForNodes(
		this.props.data.linkableElementsQuery
	);
	initialSelectedNode =
		this.initialNodes.find(
			(node) => node.nodeId === this.props.data.nodeId
		) || null;
	isMountedInDOM = false;
	searchInputRef = null;

	state = {
		displayedNodes: this.initialNodes,
		isSubmitButtonDisabled:
			(this.initialSelectedNode &&
				!!this.props.data.insertOperationName) ||
			!this.initialSelectedNode,
		searchInput: '',
		selectedNode: this.initialSelectedNode,
	};

	filterInitialNodes = (searchInput) =>
		this.initialNodes.filter(
			(node) =>
				node.markupLabel
					.toLowerCase()
					.includes(searchInput.toLowerCase()) ||
				node.searchLabel
					.toLowerCase()
					.includes(searchInput.toLowerCase())
		);

	handleSearchInputChange = (searchInput) =>
		this.setState({
			searchInput,
			displayedNodes:
				searchInput === ''
					? this.initialNodes
					: this.filterInitialNodes(searchInput),
		});

	handleSearchInputRef = (searchInputRef) =>
		(this.searchInputRef = searchInputRef);

	determineSubmitButtonState = (selectedNode) => {
		const { insertOperationName } = this.props.data;

		if (selectedNode && insertOperationName) {
			const initialData = {
				...this.props.data,
				nodeId: selectedNode.nodeId,
				documentId: selectedNode.documentId,
			};

			operationsManager
				.getOperationState(insertOperationName, initialData)
				.then(
					(operationState) =>
						this.isMountedInDOM &&
						this.setState({
							isSubmitButtonDisabled: !operationState.enabled,
						})
				)
				.catch(
					(_) =>
						this.isMountedInDOM &&
						this.setState({ isSubmitButtonDisabled: true })
				);
		}
	};

	handleNodeListItemClick = (selectedNode) => {
		this.setState({
			selectedNode,
			isSubmitButtonDisabled:
				(selectedNode && !!this.props.data.insertOperationName) ||
				!selectedNode,
		});

		this.determineSubmitButtonState(selectedNode);
	};

	handleSubmit = (node) =>
		this.props.submitModal({
			nodeId: node.nodeId,
			documentId: node.documentId,
		});

	handleKeyDown = (event) => {
		switch (event.key) {
			case 'Escape':
				this.props.cancelModal();
				break;
			case 'Enter':
				if (!this.state.isSubmitButtonDisabled) {
					this.handleSubmit(this.state.selectedNode);
				}
				break;
		}
	};

	handleItemDoubleClick = (selectedNode) => {
		const { insertOperationName } = this.props.data;

		if (insertOperationName) {
			const initialData = {
				...this.props.data,
				nodeId: selectedNode.nodeId,
				documentId: selectedNode.documentId,
			};

			operationsManager
				.getOperationState(insertOperationName, initialData)
				.then(
					(operationState) =>
						this.isMountedInDOM &&
						operationState.enabled &&
						this.handleSubmit(selectedNode)
				)
				.catch((_error) => {
					return;
				});
		} else {
			this.handleSubmit(selectedNode);
		}
	};

	handleSubmitButtonClick = () => this.handleSubmit(this.state.selectedNode);

	render() {
		const {
			displayedNodes,
			isSubmitButtonDisabled,
			searchInput,
			selectedNode,
		} = this.state;
		const {
			cancelModal,
			data: { modalIcon, modalPrimaryButtonLabel, modalTitle },
		} = this.props;

		return (
			<Modal size="l" onKeyDown={this.handleKeyDown}>
				<ModalHeader icon={modalIcon} title={modalTitle} />

				<ModalBody>
					<ModalContent flexDirection="column">
						<ModalContentToolbar>
							<Flex applyCss={searchInputContainerStyles}>
								<SearchInput
									onChange={this.handleSearchInputChange}
									ref={this.handleSearchInputRef}
									value={searchInput}
								/>
							</Flex>
						</ModalContentToolbar>

						<ModalContent>
							<ModalContent flex="1">
								<NodesList
									nodes={displayedNodes}
									onItemClick={this.handleNodeListItemClick}
									onItemDoubleClick={
										this.handleItemDoubleClick
									}
									searchInput={searchInput}
									selectedNode={selectedNode}
								/>
							</ModalContent>

							{selectedNode && (
								<ModalContent
									flexDirection="column"
									flex="2"
									isScrollContainer
								>
									<FxNodePreview
										documentId={selectedNode.documentId}
										traversalRootNodeId={
											selectedNode.nodeId
										}
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
						isDisabled={isSubmitButtonDisabled}
						onClick={this.handleSubmitButtonClick}
					/>
				</ModalFooter>
			</Modal>
		);
	}

	componentDidMount() {
		this.isMountedInDOM = true;

		this.searchInputRef.focus();

		this.determineSubmitButtonState(this.state.selectedNode);
	}

	componentWillUnmount() {
		this.isMountedInDOM = false;
	}
}

export default NodesBrowserModal;
