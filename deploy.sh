#!/bin/bash

export PATH="/opt/render/.local/bin:$PATH"
echo $PATH

npm install --production --no-cache --force
pip3 install spleeter tensorflow
