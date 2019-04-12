#!/bin/bash
DATASET=SCRNA-SEQ
DIR=/Users/rossmith/prj/kpmp/data/pictor-worker
DST=$DIR/out-kpmp
BARCODES=$DIR/in-kpmp/KPMP_AllDatasets_Barcodes_clusters_041119.txt
DATA=$DIR/in-kpmp/KPMP_AllDatasets_Data_041119.txt
node index.js $DATASET $DST $BARCODES $DATA
