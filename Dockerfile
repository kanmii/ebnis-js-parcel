FROM node:12.17.0-buster-slim

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV BUILD_DEPS="build-essential"

ARG PORT=3000
ENV PORT $PORT
EXPOSE $PORT 9229 9230


RUN apt-get update \
  && apt-get install -y ${BUILD_DEPS} --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /usr/share/doc && rm -rf /usr/share/man \
  && apt-get purge -y --auto-remove ${BUILD_DEPS} \
  && apt-get clean

RUN mkdir /opt/node_app && chown node:node /opt/node_app
WORKDIR /opt/node_app

USER node
COPY package.json yarn.lock package-scripts.js ./

RUN yarn install
ENV PATH /opt/node_app/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
WORKDIR /opt/node_app/app
COPY . .

CMD [ "bash" ]
