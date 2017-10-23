# Bookclub - a module for storing information about books

## Attributes:

common:
- title
- authors
- description
- [images]

subjective:
(- user (implied))
- rating
- rating type
- read (datetime)
- review
- shelves
- categories/genres

## Dependencies:

If we seperate common from user attributes, we can just merge into a
global object. User related (subjective) should infer the user from
who posted it and merge into a list.

## Status

Initial rough version to test idea.

SameAs (for merging multiple books) might be needed, but can be added later.

## TODO

- Fix books list
- Add subjective

## Methods

- Posting
- View

