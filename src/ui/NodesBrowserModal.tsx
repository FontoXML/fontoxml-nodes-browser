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
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import blueprintQuery from 'fontoxml-blueprints/src/blueprintQuery';
import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
import documentsManager from 'fontoxml-documents/src/documentsManager';
import getNodeId from 'fontoxml-dom-identification/src/getNodeId';
import FxNodePreview from 'fontoxml-fx/src/FxNodePreview';
import type { ModalProps } from 'fontoxml-fx/src/types';
import useOperation from 'fontoxml-fx/src/useOperation';
import t from 'fontoxml-localization/src/t';
import operationsManager from 'fontoxml-operations/src/operationsManager';
import evaluateXPathToNodes from 'fontoxml-selectors/src/evaluateXPathToNodes';
import evaluateXPathToString from 'fontoxml-selectors/src/evaluateXPathToString';
import xq from 'fontoxml-selectors/src/xq';

import type { NodeViewModel } from './NodesList';
import NodesList from './NodesList';

function upperCaseFirstLetter(input: string): string {
	const firstCodePoint = input.codePointAt(0);
	if (!firstCodePoint) {
		return '';
	}
	const firstCharacter = String.fromCodePoint(firstCodePoint);
	return (
		firstCharacter.toUpperCase() + input.substring(firstCharacter.length)
	);
}

const createViewModelsForNodes = (linkableElementsQuery): NodeViewModel[] =>
	documentsManager
		.getAllDocumentIds({ 'cap/operable': true })
		.flatMap((documentId) => {
			const documentNode = documentsManager.getDocumentNode(documentId);

			const nodes = evaluateXPathToNodes(
				linkableElementsQuery,
				documentNode,
				readOnlyBlueprint
			);

			return nodes.map((node) => {
				// Used for searches
				const textContent = blueprintQuery.getTextContent(
					readOnlyBlueprint,
					node
				);
				const markupLabel = upperCaseFirstLetter(
					evaluateXPathToString(
						xq`fonto:markup-label(.)`,
						node,
						readOnlyBlueprint
					)
				);

				const titleContent = evaluateXPathToString(
					xq`fonto:title-content(.)`,
					node,
					readOnlyBlueprint
				);

				return {
					documentId,
					nodeId: getNodeId(node),
					markupLabel,
					shortLabel:
						titleContent || textContent || t('(Empty element)'),
					textContent,
				};
			});
		});

const searchInputContainerStyles = { maxWidth: '20rem', width: '100%' };

const NodesBrowserModal: React.FC<
	ModalProps<{
		documentId?: string;
		insertOperationName?: string;
		linkableElementsQuery: string;
		modalIcon?: string;
		modalPrimaryButtonLabel: string;
		modalTitle: string;
		nodeId?: string;
	}>
> = ({ data, submitModal, cancelModal }) => {
	const initialNodes = useMemo(
		() => createViewModelsForNodes(data.linkableElementsQuery),
		[data.linkableElementsQuery]
	);

	// Nodes can be filtered with a search query
	const [searchQuery, setSearchQuery] = useState('');
	const displayedNodes = useMemo(() => {
		const lowerCaseQuery = searchQuery.toLowerCase();
		return initialNodes.filter(
			(node) =>
				node.shortLabel.toLowerCase().includes(lowerCaseQuery) ||
				node.textContent.toLowerCase().includes(lowerCaseQuery) ||
				node.markupLabel.toLowerCase().includes(lowerCaseQuery)
		);
	}, [initialNodes, searchQuery]);

	// A node can be selected by the user
	const [selectedNode, setSelectedNode] = useState(
		() => initialNodes.find((node) => node.nodeId === data.nodeId) || null
	);
	const handleNodeListItemClick = useCallback(
		(selectedNode: NodeViewModel) => {
			setSelectedNode(selectedNode);
		},
		[]
	);

	// Changing the query unselects the selected node
	const handleSearchInputChange = useCallback((searchQuery: string) => {
		setSearchQuery(searchQuery);
		setSelectedNode(null);
	}, []);

	// The insert button is enabled if a node is selected and there either is
	// no configured insertOperationName or that operation is enabled for the
	// selected item
	const operationData = useMemo(
		() => ({
			...data,
			nodeId: selectedNode?.nodeId,
			documentId: selectedNode?.documentId,
		}),
		[selectedNode, data]
	);
	const { operationState } = useOperation(
		selectedNode && data.insertOperationName
			? data.insertOperationName
			: 'do-nothing',
		operationData
	);
	const isSubmitButtonDisabled = !selectedNode || !operationState.enabled;

	// The modal can be submitted in various ways...
	const handleSubmit = useCallback(
		(selectedNode: NodeViewModel | null) => {
			if (!selectedNode || !operationState.enabled) {
				return;
			}
			submitModal({
				nodeId: selectedNode.nodeId,
				documentId: selectedNode.documentId,
			} as never);
		},
		[submitModal, operationState]
	);

	// ...by pressing enter (or escape to cancel it)
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			switch (event.key) {
				case 'Escape':
					event.preventDefault();
					cancelModal();
					break;
				case 'Enter':
					event.preventDefault();
					handleSubmit(selectedNode);
					break;
			}
		},
		[cancelModal, handleSubmit, selectedNode]
	);

	// ...by clicking the submit button
	const handleSubmitButtonClick = useCallback(() => {
		handleSubmit(selectedNode);
	}, [handleSubmit, selectedNode]);

	// ...or by double-clicking an item
	const isMountedInDomRef = useRef(true);
	useEffect(() => {
		return () => {
			isMountedInDomRef.current = false;
		};
	});
	const handleItemDoubleClick = useCallback(
		async (selectedNode: NodeViewModel) => {
			if (!data.insertOperationName) {
				handleSubmit(selectedNode);
				return;
			}

			// We should check that the insert operation is enabled for this node
			const initialData = {
				...data,
				nodeId: selectedNode.nodeId,
				documentId: selectedNode.documentId,
			};

			const operationState = await operationsManager.getOperationState(
				data.insertOperationName,
				initialData
			);
			if (!isMountedInDomRef.current || !operationState.enabled) {
				return;
			}
			handleSubmit(selectedNode);
		},
		[data, handleSubmit]
	);

	// Auto-focus the search input when opening the modal
	const searchInputRef = useRef<HTMLElement>();
	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, []);

	return (
		<Modal size="l" onKeyDown={handleKeyDown}>
			<ModalHeader icon={data.modalIcon} title={data.modalTitle ?? ''} />

			<ModalBody>
				<ModalContent flexDirection="column">
					<ModalContentToolbar>
						<Flex applyCss={searchInputContainerStyles}>
							<SearchInput
								onChange={handleSearchInputChange}
								ref={searchInputRef}
								value={searchQuery}
								data-test-id="nodes-browser-modal-search-input"
							/>
						</Flex>
					</ModalContentToolbar>

					<ModalContent>
						<ModalContent flex="1">
							<NodesList
								nodes={displayedNodes}
								onItemClick={handleNodeListItemClick}
								onItemDoubleClick={handleItemDoubleClick}
								searchQuery={searchQuery}
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
					label={data.modalPrimaryButtonLabel}
					isDisabled={isSubmitButtonDisabled}
					onClick={handleSubmitButtonClick}
				/>
			</ModalFooter>
		</Modal>
	);
};

export default NodesBrowserModal;
