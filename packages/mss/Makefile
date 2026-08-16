RELEASE=$(shell git describe --always --tags)
BUILD_TIME?=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
HUB := "images.digitalms.ru/ips-metamart"
APP := "metamart-subscription-service-ui"

prepare:
	asdf install nodejs 18.7.0  || true
	asdf local nodejs 18.7.0  || true
	npm install --force

#build image
image:
	docker image build --build-arg REACT_APP_MAIN_THEME=true --build-arg PUBLIC_URL=/  -t ${HUB}/${APP}:${RELEASE} -t ${HUB}/${APP}:latest -f ./Dockerfile .

#push image to harbor
push:
	docker push ${HUB}/${APP}:${RELEASE}
	docker push ${HUB}/${APP}:latest

# unit tests
test:
	npm run test

# acceptance tests
check-behavior:
	karate ./features/*

development:
	npm start
