#!/bin/bash

export PATH="/opt/render/.local/bin:adata>=4.4 in /usr/local/lib/python3.7/dist-packages:$PATH"
echo $PATH

npm install --production --no-cache --force
pip3 install spleeter tensorflow
python3 -m site --user-site

