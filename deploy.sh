#!/bin/bash

python3 --version
which python3

npm install --production --no-cache --force
python3 -m pip install --upgrade pip
python3 -m venv myenv
source myenv/bin/activate

export PATH="$(which python3):/opt/render/.local/bin:$(python3 -m site --user-site):$PATH"
echo $PATH

pip3 install spleeter tensorflow