import * as React from 'react';

import blueprintQuery from 'fontoxml-blueprints/src/blueprintQuery';
import readOnlyBlueprint from 'fontoxml-blueprints/src/readOnlyBlueprint';
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
} from 'fontoxml-design-system/src/components';
import documentsManager from 'fontoxml-documents/src/documentsManager';
import getNodeId from 'fontoxml-dom-identification/src/getNodeId';
import FxNodePreview from 'fontoxml-fx/src/FxNodePreview';
import type { ModalProps } from 'fontoxml-fx/src/types';
import useOperation from 'fontoxml-fx/src/useOperation';
import t from 'fontoxml-localization/src/t';
import operationsManager from 'fontoxml-operations/src/operationsManager';
import type { OperationState } from 'fontoxml-operations/src/types';
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
	const initialNodes = React.useMemo(
		() => createViewModelsForNodes(data.linkableElementsQuery),
		[data.linkableElementsQuery]
	);

	// Nodes can be filtered with a search query
	const [searchQuery, setSearchQuery] = React.useState('');
	const displayedNodes = React.useMemo(() => {
		const lowerCaseQuery = searchQuery.toLowerCase();
		return initialNodes.filter(
			(node) =>
				node.shortLabel.toLowerCase().includes(lowerCaseQuery) ||
				node.textContent.toLowerCase().includes(lowerCaseQuery) ||
				node.markupLabel.toLowerCase().includes(lowerCaseQuery)
		);
	}, [initialNodes, searchQuery]);

	// A node can be selected by the user
	const [selectedNode, setSelectedNode] = React.useState(
		() => initialNodes.find((node) => node.nodeId === data.nodeId) || null
	);
	const handleNodeListItemClick = React.useCallback(
		(selectedNode: NodeViewModel) => {
			setSelectedNode(selectedNode);
		},
		[]
	);

	// Changing the query unselects the selected node
	const handleSearchInputChange = React.useCallback((searchQuery: string) => {
		setSearchQuery(searchQuery);
		setSelectedNode(null);
	}, []);

	// The submit button is enabled if a node is selected and there either is
	// no configured insertOperationName or that operation is enabled for the
	// selected item
	const operationData = React.useMemo(
		() => ({
			...data,
			nodeId: selectedNode?.nodeId,
			documentId: selectedNode?.documentId,
		}),
		[selectedNode, data]
	);
	const operationName = React.useMemo(
		() =>
			selectedNode && data.insertOperationName
				? data.insertOperationName
				: 'do-nothing',
		[data.insertOperationName, selectedNode]
	);
	const { operationState } = useOperation(operationName, operationData);
	const isSubmitButtonDisabled = React.useMemo(
		() => !selectedNode || !operationState.enabled,
		[operationState.enabled, selectedNode]
	);

	// The modal can be submitted in various ways...
	const handleSubmit = React.useCallback(
		(
			selectedNode: NodeViewModel | null,
			operationState: OperationState
		) => {
			// This cannot rely on the selectedNode state var or the
			// operationState from useOperation, as those might not be up to
			// date when double clicking, see handleItemDoubleClick as well.
			if (!selectedNode || !operationState.enabled) {
				return;
			}
			submitModal({
				nodeId: selectedNode.nodeId as never,
				documentId: selectedNode.documentId as never,
			});
		},
		[submitModal]
	);

	// ...by pressing enter (or escape to cancel it)
	const handleKeyDown = React.useCallback(
		(event: KeyboardEvent) => {
			switch (event.key) {
				case 'Escape':
					event.preventDefault();
					cancelModal();
					break;
				case 'Enter':
					event.preventDefault();
					handleSubmit(selectedNode, operationState);
					break;
			}
		},
		[cancelModal, handleSubmit, operationState, selectedNode]
	);

	// ...by clicking the submit button
	const handleSubmitButtonClick = React.useCallback(() => {
		handleSubmit(selectedNode, operationState);
	}, [handleSubmit, operationState, selectedNode]);

	// ...or by double-clicking an item
	const isMountedInDomRef = React.useRef(false);
	React.useEffect(() => {
		isMountedInDomRef.current = true;
		return () => {
			isMountedInDomRef.current = false;
		};
	}, []);
	const handleItemDoubleClick = React.useCallback(
		async (selectedNode: NodeViewModel) => {
			// selectedNode is never null
			const operationName = data.insertOperationName || 'do-nothing';
			// When double clicking an item, the second click is so fast
			// after the first click that while we are processing the initial
			// click, which should update the selectedNode, that has not
			// happened yet. And then especially updating the operationState in
			// response to the new selectedNode has not happened yet.
			// So we get the operationState here again based on the selectedNode
			// that is being double clicked (param, not state var) and pass that
			// along to handleSubmit, which then checks if we can submit.
			const operationState = await operationsManager.getOperationState(
				operationName,
				{
					...data,
					nodeId: selectedNode?.nodeId,
					documentId: selectedNode?.documentId,
				}
			);
			// Because we await the operationState, we could've been unmounted
			// while we (a)waited, so check for that first
			if (!isMountedInDomRef.current) {
				return;
			}
			handleSubmit(selectedNode, operationState);
		},
		[data, handleSubmit]
	);

	// Auto-focus the search input when opening the modal
	const searchInputRef = React.useRef<HTMLElement>();
	React.useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, []);

	return (
		<Modal size="l" onKeyDown={handleKeyDown}>
			<ModalHeader icon={data.modalIcon} title={data.modalTitle} />

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
