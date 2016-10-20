FROM pinkkis/raspbian-base:latest

RUN mkdir -p /srv
WORKDIR /srv

COPY package.json .
RUN npm install
COPY . .

CMD [ "npm", "start" ]