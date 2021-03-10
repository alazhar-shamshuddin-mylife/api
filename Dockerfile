FROM node:lts-alpine
ARG API_PORT
ARG TIMEZONE

RUN apk --update-cache add tzdata
RUN cp /usr/share/zoneinfo/${TIMEZONE} /etc/localtime

# The following command is only required for development purposes:
RUN npm install nodemon -g

WORKDIR /mylife/api

# The follow steps are not useful during delevelopment because we mount our
# host's development directory via a bind-mount at /mylife/api.  This
# hides the changes below with the contents of the mounted directory when we
# execute `docker-compose up`.  The changes below would be useful for
# production, however, where we would not bind mount our development directory.

#COPY ./package.json .
#RUN npm cache clean --force
#RUN npm install
#COPY . .

EXPOSE ${API_PORT}

CMD [ "/bin/sh" ]