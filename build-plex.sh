#!/bin/bash

# BUILD PLEX
# 2019-04-26 1:40 PM

# Goal here is to rapidly process env $LETTER for all sites in parallel

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

for x in {A..Z}; do
  GENE_FILTER="$LETTER$x" node ./index.js --mungeConfig=./mungeConfigs/build-2/$DATASET.env &
done
