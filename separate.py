#!/usr/bin/python
import os
import sys
sys.path.insert(0, '/opt/render/.local/bin')
from spleeter.separator import Separator

input_file = os.path.abspath(sys.argv[1])
output_dir = os.path.abspath(sys.argv[2])

separator = Separator('spleeter:2stems')
separator.separate_to_file(input_file, output_dir, codec='mp3')
