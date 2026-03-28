# Flurry — snowflake randomart generator

# Install dependencies
install:
    npm install

# Run demo dev server
dev:
    npm run dev

# Build the library
build:
    npm run build

# Build the demo site
build-demo:
    npm run build:demo

# Run tests
test:
    npm run test

# Run tests in watch mode
test-watch:
    npm run test:watch

# Type-check
lint:
    npm run lint

# Clean build artifacts
clean:
    rm -rf dist demo-dist node_modules/.vite

# Build everything
all: build build-demo
