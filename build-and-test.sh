#!/bin/bash
#### This file will regenerate only the 2 given genes, replace the files in test/data, and rerun tests.
#### These are the same 2 genes that the files ViolinBinWorker.{CCDC115,NPHS2}.test.js expect, so re-running tests
#### without previously regenerating files (such as with CI) should also work fine.
#### Mostly this script is helpful for interactively debugging while changing code and updating test logic.

rm -rf ./tests/data/dst
node ./index.js --mungeConfig=./tests/test.env
node ./tests/test-runner.js --mungeConfig=./tests/test.env