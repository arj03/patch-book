# A module for storing information about books

## Attributes:

common:
- isbn (unique)
- title
- authors
- [images]

user-related:
(- user (implied))
- rating
- read (datetime)
- review
- shelves
- categories/genres

## Dependencies:

If we seperate common from user attributes, we can just merge into a
global object. User related should infer the user from who posted it and merge into a list.

https://github.com/arj03/ssb-entitydb

Patchcore

## Methods

- Posting
- View

