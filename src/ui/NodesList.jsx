import React, { PureComponent } from 'react';

import { Block, Flex, Label, ListItem, StateMessage, Text, VirtualList } from 'fds/components';
import t from 'fontoxml-localization/src/t.js';

class NodesList extends PureComponent {
	handleRenderItem = ({ key, item, onClick, onDoubleClick, onRef }) => (
		<ListItem
			key={key}
			isSelected={item === this.props.selectedNode}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			onRef={onRef}
		>
			<Flex flexDirection="column">
				<Label>{item.shortLabel}</Label>

				<Text colorName="text-muted-color">{item.markupLabel}</Text>
			</Flex>
		</ListItem>
	);

	renderResultsCounter(nodesLength, searchInput) {
		if (searchInput) {
			return (
				<Label align="center" colorName="text-muted-color">
					{t('{NODES_LENGTH} results for “{SEARCH_INPUT}”', {
						NODES_LENGTH: nodesLength,
						SEARCH_INPUT: searchInput
					})}
				</Label>
			);
		}

		return (
			<Label align="center" colorName="text-muted-color">
				{t('{NODES_LENGTH} elements', { NODES_LENGTH: nodesLength })}
			</Label>
		);
	}

	render() {
		const { nodes, onItemClick, onItemDoubleClick, searchInput, selectedNode } = this.props;

		return (
			<Block flex="1" isScrollContainer>
				{nodes.length !== 0 && (
					<Flex justifyContent="center" paddingSize="m">
						{this.renderResultsCounter(nodes.length, searchInput)}
					</Flex>
				)}

				{nodes.length === 0 && searchInput !== '' && (
					<StateMessage
						paddingSize="l"
						visual="meh-o"
						title={t("We can't find that.")}
						message={t(
							'We can’t find any items with “{SEARCH_INPUT_VALUE}” in their content or name. Please try something else.',
							{ SEARCH_INPUT_VALUE: searchInput }
						)}
					/>
				)}

				{nodes.length === 0 && searchInput === '' && (
					<StateMessage
						paddingSize="l"
						visual="meh-o"
						title={t('No items found.')}
						message={t(
							'We couldn\'t find any items in the document. Please click on "Cancel" and create an item first.'
						)}
					/>
				)}

				{nodes.length !== 0 && (
					<VirtualList
						estimatedItemHeight={50}
						items={nodes}
						onItemClick={onItemClick}
						onItemDoubleClick={onItemDoubleClick}
						paddingSize="s"
						renderItem={this.handleRenderItem}
						idToScrollIntoView={selectedNode ? selectedNode.id : null}
					/>
				)}
			</Block>
		);
	}
}

export default NodesList;
