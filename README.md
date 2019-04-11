# Pictor Worker

*The Dockerfile is TBD/may not be needed just yet.*

## Running the worker

The script requires the following parameters in order.

* 1: *datasetNameInput* - Dataset name to prefix to dataset files and legend file
* 2: *dstOutputPath* - Root folder to receive gene subfolders and dataset legend file
* 3: *barcodeToCellMapInputPath* - Map of cell barcodes to site-specific cell cluster IDs
* 4: *readCountTableInputPath* - Input data table, mapping genes as rows, barcodes as columns, and read counts as cells
* 5: *delimiterInput* - Optional input delimiter character; defaults to tab
* 6: *delimiterOutput* - Optional output delimiter character; defaults to comma

Output files are generated with .csv extension if the comma is detected as output delimiter, otherwise .txt is used.

Example:
`node index.js "LMD" "./public/data/dst" "./public/data/barcodes.txt" "./public/data/table.txt" "\t" ","`

## Shell execution example

On OSX you can use `run.sh` to test the script locally.  You can look at that for another example of running the worker.
