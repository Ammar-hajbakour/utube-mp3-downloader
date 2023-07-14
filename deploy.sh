#!/bin/bash

export PATH="/opt/render/.local/bin:/opt/render/.local/lib/python3.7/site-packages:$PATH"
echo $PATH

npm install --production --no-cache --force
python3 -m pip install --upgrade pip
pip3 install spleeter tensorflow
python3 -m site --user-site