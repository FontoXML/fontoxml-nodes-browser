---
category: add-on/fontoxml-nodes-browser
---

# Nodes browser library

This add-on exposes the {@link operation/open-nodes-browser-modal} operation for opening a nodes browser. This browser allows the user to choose between specified element nodes from the documents currently opened in the editor. This, for example, can be used while selecting a target for a link.

## Getting started

This add-on can be added to an editor by selecting the checkbox for this add-on in the [SDK portal](http://sdk.fontoxml.com/). Then install this add-on [as usual](https://developers.fontoxml.com/install-add-on).

## Usage

This browser can be used by adding the following operation step to your operation:

```
{
    "type": "operation/open-nodes-browser-modal"
}
```
The following properties can be used with this operation:

* When this modal is used to edit an existing link, the `documentId` and `nodeId` properties can be used to set the selection on the original node.
* The set of nodes which to choose from is specified by the `linkableElementsQuery`.
* Use `insertOperationName` to disable the primary button based on the operation state.
* The modal icon, title and primary button label can be set with the `modalIcon`, `modalTitle` and `modalPrimaryButtonLabel` respectively.

For more information see {@link operation/open-nodes-browser-modal}.

# Contributing

This package can serve as a base for custom versions of the nodes browser. It can be forked by
checking it out directly in the `packages` folder of an editor. When making a fork, consider keeping
it up-to-date with new Fonto Editor versions when they release.

We highly appreciate pull requests if you find a bug. For more general improvements or new features,
please file a [support.fontoxml.com](support request). That way, we can think along and make sure an
improvement is made in a way that benefits all users of this package.
