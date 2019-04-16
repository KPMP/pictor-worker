# Pictor Worker

*The Dockerfile is TBD/may not be needed just yet.*

## Running the worker

This script parses transcriptomic read count tables and cell barcodes into servable CSVs.
The parameters are stored in a .env file. Copy .env.example to .env and update it accordingly.
You may also specify a .env file.

Example:
node index.js                              # Uses default .env in same directory
node index.js --config=./some/other/.env   # Use a custom .env file
node index.js -c=./some/other.env          # Same as above
