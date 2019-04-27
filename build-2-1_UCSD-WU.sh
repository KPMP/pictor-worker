#!/bin/bash

# BUILD 2-1, UCSD-WU
# 2019-04-25 10:00 AM

# Goal here is to process all genes from DU to DZ.
# This will bring the letter D to completion across all 3 data sets.

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

# for x in {D}; do
x=D
  for y in {U..Z}; do
    GENE_FILTER="$x$y" node ./index.js --mungeConfig=./mungeConfigs/build-2/UCSD-WU.env
  done
# done
