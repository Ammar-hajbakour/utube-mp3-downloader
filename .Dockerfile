# Specify the base image with Node.js 18
FROM node:18

ENV NODE_ENV=production
# Install Python and related dependencies
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install any additional dependencies required by your Node.js app
RUN apt-get install -y dumb-init

COPY . .
RUN npm install --production --no-cache --force
RUN python3 -m pip install --upgrade pip
RUN python3 -m venv myenv
RUN source myenv/bin/activate
RUN pip3 install spleeter tensorflow
# Set the command to start your Node.js app
CMD dumb-init node app.js