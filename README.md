# Add-on fontoxml-nodes-browser

This add-on exposes the {@link operation/open-nodes-browser} operation for opening a nodes browser. This browser allows the user to choose between specified element nodes from the documents currently opened in the editor. This, for example, can be used while selecting a target for a link.

## Getting started

This add-on can be added to an editor by selecting the checkbox for this add-on in the [SDK portal](http://sdk.fontoxml.com/). Then install this add-on [as usual](https://developers.fontoxml.com/install-add-on).

## Usage

This browser can be used by adding the following operation step to your operation:

```
{
    "type": "operation/open-nodes-browser"
}
```
The following properties can be used with this operation:

* When this modal is used to edit an existing link, the `documentId` and `nodeId` properties can be used to set the selection on the original node.
* The set of nodes which to choose from is specified by the `linkableElementsQuery`.
* The label of the node can be set with the `labelQuery` and is by default the text content of the node.
* The modal title and primary button label can be set with the `modalTitle` and `modalPrimaryButtonLabel` respectively.

For more information see {@link operation/open-nodes-browser}.