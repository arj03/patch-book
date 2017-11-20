# Bookclub - a module for storing information about books

## Attributes:

common:
- title
- authors
- description
- series
- [images]

subjective:
(- user (implied))
- rating
- rating type
(- read (datetime))
- review
- shelve
- categories/genres

If we seperate common from user attributes, we can just merge common
into a global object. User related (subjective) should infer the user
from who posted it and merge into a list.