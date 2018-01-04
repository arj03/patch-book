# Patchbook

A book rating system for
[patchcore](https://github.com/ssbc/patchcore) compatible [scuttlebutt](https://github.com/ssbc/secure-scuttlebutt) clients

## Attributes:

common:
- title
- authors
- description
- series
- seriesNo
- image

subjective:
- rating
- ratingMax
- ratingType
- review
- shelve
- genre

If we seperate common from user attributes, we can just merge common
into a global object. User related (subjective) should infer the user
from who posted it and merge into a list.