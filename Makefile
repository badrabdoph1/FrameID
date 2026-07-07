.PHONY: dev build start lint typecheck test db-setup db-migrate db-seed docker-up docker-down check setup validate-env

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

db-setup:
	npm run db:deploy

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

docker-up:
	docker compose up -d

docker-down:
	docker compose down

validate-env:
	npm run validate:env

check: typecheck lint test

setup: docker-up validate-env db-setup
