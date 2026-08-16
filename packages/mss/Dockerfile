FROM nginx:alpine
ENV ESC='$'
RUN rm -rf /usr/share/nginx/html/*
COPY docs /usr/share/nginx/html
COPY template /usr/share/nginx/html/template
COPY services /usr/share/nginx/html/services
COPY nginx.conf /etc/nginx/nginx.template
CMD envsubst < /etc/nginx/nginx.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'
