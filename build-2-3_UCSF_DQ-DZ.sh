#!/bin/bash

# BUILD 2-1, UMICH
# 2019-04-26 10:25 AM

# Goal here is to rapidly process CQ - CZ for UCSF.

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

# for x in {D}; do
x=D
  for y in {Q..Z}; do
    GENE_FILTER="$x$y" node ./index.js --mungeConfig=./mungeConfigs/build-2/UCSF.env
  done
# done

