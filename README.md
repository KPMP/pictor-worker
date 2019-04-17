# Pictor Worker

*The Dockerfile is TBD/may not be needed just yet.*

## Running the worker

This script parses transcriptomic read count tables and cell barcodes into servable CSVs.
The parameters are stored in `.env`. Copy `.env.example` to `.env` and update it accordingly.
You may also specify a file to use instead with `--mungeConfig` or `-m`.

WARNING: If no `.env` is found, defaults will be used silently as defined in `src/util/env.js`.

Example:
```
node index.js                                   # Uses default .env in same directory
node index.js --mungeConfig=./some/other/.env   # Use a custom .env file
node index.js -m=./some/other.env               # Same as above
```