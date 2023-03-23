import * as React from 'react';

import {
	Flex,
	Label,
	ListItem,
	StateMessage,
	Text,
	VirtualList,
} from 'fontoxml-design-system/src/components';
import type { DocumentId } from 'fontoxml-documents/src/types';
import type { NodeId } from 'fontoxml-dom-identification/src/types';
import t from 'fontoxml-localization/src/t';

export type NodeViewModel = {
	documentId: DocumentId;
	nodeId: NodeId;
	markupLabel: string;
	shortLabel: string;
	textContent: string;
};

const NodesList: React.FC<{
	nodes: NodeViewModel[];
	onItemClick(node: NodeViewModel): void;
	onItemDoubleClick(node: NodeViewModel): void;
	searchQuery: string;
	selectedNode: NodeViewModel | null;
}> = ({ nodes, onItemClick, onItemDoubleClick, searchQuery, selectedNode }) => {
	const handleRenderItem = React.useCallback(
		({ key, item, onClick, onDoubleClick, onRef }) => (
			<ListItem
				key={key}
				isSelected={item === selectedNode}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				onRef={onRef}
			>
				<Flex flexDirection="column">
					<Label>{item.shortLabel}</Label>

					<Text colorName="text-muted-color">{item.markupLabel}</Text>
				</Flex>
			</ListItem>
		),
		[selectedNode]
	);

	return (
		<Flex flex="1" flexDirection="column">
			{nodes.length !== 0 && (
				<Flex justifyContent="center" paddingSize="m">
					{searchQuery ? (
						<Label colorName="text-muted-color">
							{t(
								'{NUMBER_OF_NODES} results for “{SEARCH_QUERY}”',
								{
									NUMBER_OF_NODES: nodes.length,
									SEARCH_QUERY: searchQuery,
								}
							)}
						</Label>
					) : (
						<Label colorName="text-muted-color">
							{t('{NUMBER_OF_NODES} elements', {
								NUMBER_OF_NODES: nodes.length,
							})}
						</Label>
					)}
				</Flex>
			)}

			{nodes.length === 0 && searchQuery !== '' && (
				<StateMessage
					paddingSize="l"
					visual="meh-o"
					title={t("We can't find that.")}
					message={t(
						'We can’t find any items with “{SEARCH_QUERY}” in their content or name. Please try something else.',
						{ SEARCH_QUERY: searchQuery }
					)}
				/>
			)}

			{nodes.length === 0 && searchQuery === '' && (
				<StateMessage
					paddingSize="l"
					visual="meh-o"
					title={t('No items found.')}
					message={t(
						"We couldn't find any items in the document. Please close the modal and create an item first."
					)}
				/>
			)}

			{nodes.length !== 0 && (
				<VirtualList
					estimatedItemHeight={50}
					items={nodes}
					itemKeyToUseAsId="nodeId"
					onItemClick={onItemClick}
					onItemDoubleClick={onItemDoubleClick}
					paddingSize="s"
					renderItem={handleRenderItem}
					idToScrollIntoView={
						selectedNode ? selectedNode.nodeId : null
					}
				/>
			)}
		</Flex>
	);
};
export default NodesList;
