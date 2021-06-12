install: install-deps

start:
	npx @hexlet/react-todo-app-with-backend

install-deps:
	npm ci

test:
	npm test

lint:
	npx eslint .
