#!/bin/bash
#### This file will regenerate only the 2 given genes, replace the files in test/data, and rerun tests.
#### These are the same 2 genes that the files ViolinBinWorker.{CCDC115,NPHS2}.test.js expect, so re-running tests
#### without previously regenerating files should also work fine.
#### Mostly this script is helpful for interactively debugging while changing code and updating test logic.

DST_DIR=/Users/rossmith/prj/kpmp/data/pictor-worker/out-kpmp-test

node ./index.js --mungeConfig=./tests/test.env

cp $DST_DIR/C/CCDC115/*.csv ./tests/data/CCDC115/
cp $DST_DIR/N/NPHS2/*.csv ./tests/data/NPHS2/

node ./tests/test-runner.js --mungeConfig=./tests/test.env