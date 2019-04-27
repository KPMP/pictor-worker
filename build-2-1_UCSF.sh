#!/bin/bash

# BUILD 2-1, UCSF
# 2019-04-26 10:00 AM

# Goal here is to reprocess all genes from prefix BJ to BZ.
# This will bring the letter B to completion across all 3 data sets with current processing.

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

# for x in {B}; do
x=B
  for y in {J..Z}; do
    GENE_FILTER="$x$y" node ./index.js --mungeConfig=./mungeConfigs/build-2/UCSF.env
  done
# done
