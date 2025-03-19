.PHONY: build

VERSION = 0.1.1.6
HASH = $(shell git rev-parse --short HEAD)
bump:
	@echo "Bumping version to $(VERSION) recursively..."

	@sed -i 's/version=.*/version=$(VERSION)/' .env
	@sed -i 's/hash=.*/hash=$(HASH)/' .env
	
build:
	@sed -i 's/version=.*/version=$(VERSION)/' .env
	@sed -i 's/hash=.*/hash=$(HASH)/' .env
	@npm run build
initdocker:
	@docker buildx create --name openiap --use
	@docker buildx inspect --bootstrap
compose:
	@sed -i 's/version=.*/version=$(VERSION)/' .env
	@sed -i 's/hash=.*/hash=$(HASH)/' .env
	@sed -i 's/base: "\/ui"/base: ""/' svelte.config.js
	@docker buildx build -t cloudhack/core-web:$(HASH) -t cloudhack/core-web:$(VERSION) -t cloudhack/core-web:edge --platform linux/amd64 --push .
	@sed -i 's/base: ""/base: "\/ui"/' svelte.config.js
publish:
	@sed -i 's/version=.*/version=$(VERSION)/' .env
	@sed -i 's/hash=.*/hash=$(HASH)/' .env
	@sed -i 's/base: "\/ui"/base: ""/' svelte.config.js
	# @docker buildx build -t cloudhack/core-web:$(HASH) -t cloudhack/core-web:$(VERSION) -t cloudhack/core-web:latest --platform linux/amd64,linux/arm64,linux/arm/v7 --push .
	@docker buildx build -t cloudhack/core-web:$(HASH) -t cloudhack/core-web:$(VERSION) -t cloudhack/core-web:latest --platform linux/amd64 --push .
	@sed -i 's/base: ""/base: "\/ui"/' svelte.config.js
