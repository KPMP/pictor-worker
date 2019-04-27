#!/bin/bash

# BUILD 2-3, UCSF
# 2019-04-26 11:30 AM

# Goal here is to rapidly process DA-DH for UCSF.

# rm -rf /Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-build-2

# for x in {B}; do
x=D
  for y in {A..H}; do
    GENE_FILTER="$x$y" node ./index.js --mungeConfig=./mungeConfigs/build-2/UCSF.env
  done
# done

