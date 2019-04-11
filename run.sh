#!/bin/bash
DATASET=LMD
DST=/Users/rossmith/prj/kpmp/data/pictor-worker/dst
BARCODES=./public/data/HKPH_barcodes.txt
DATA=./public/data/HKPH_Data.txt

node index.js $DATASET $DST $BARCODES $DATA
