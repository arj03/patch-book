# Bookclub - a module for storing information about books

## Attributes:

common:
- isbn
- title
- authors
- [images]

subjective:
(- user (implied))
- rating
- rating type
- read (datetime)
- review
- shelves
- categories/genres

The key will be title. We can't expect people to want to enter
ISBN. Furthermore its not globally unique.

## Dependencies:

If we seperate common from user attributes, we can just merge into a
global object. User related (subjective) should infer the user from
who posted it and merge into a list.

## Methods

- Posting
- View

