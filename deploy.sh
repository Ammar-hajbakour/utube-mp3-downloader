#!/bin/bash

python3 --version
which python3

export PATH="$(which python3):/opt/render/.local/bin:$(python3 -m site --user-site):$PATH"
echo $PATH

npm install --production --no-cache --force
python3 -m pip install --upgrade pip
pip3 install spleeter tensorflow
python3 -m site --user-site