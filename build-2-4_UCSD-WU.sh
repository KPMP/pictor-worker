#!/bin/bash

# BUILD 2-4, UCSD-WU
# 2019-04-26 12:00 PM

# Goal here is to process all genes from prefix EA to FZ.

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

for x in {G..H}; do
  for y in {A..Z}; do
    GENE_FILTER="$x$y" node ./index.js --mungeConfig=./mungeConfigs/build-2/UCSD-WU.env
  done
done


