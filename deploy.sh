#!/bin/bash

echo 'export PATH=$PATH:/opt/render/.local/bin'  >> ~/.bash_profile
setenv PATH $PATH:/opt/render/.local/bin

npm install --production --no-cache --force
pip3 install spleeter tensorflow
