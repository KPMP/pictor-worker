#!/bin/bash

# BUILD 2, UMICH
# 2019-04-25 9:00 PM

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

for x in {A..Z}; do
  for y in {A..Z}; do
    GENE_FILTER="$x$y" node ./index.js --mungeConfig=./mungeConfigs/build-2/UMich.env
  done
done
