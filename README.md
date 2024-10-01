# polycrypt

A polycrypt library for encryption and decryption using native Web Crypto API

## Installation

```sh
npm install polycrypt
# or
yarn add polycrypt
```

## Usage

```javascript
import { Polycrypt } from 'polycrypt';
// or
const { Polycrypt } = require('polycrypt');

// Use the library functions here
```

Initialize the library:

```javascript
// inject your crypto
// in browser, it will be window.crypto
// in node, it will be crypto.webcrypto from node:crypto

const polycrypt = new Polycrypt(crypto);
```

## Development

To set up the project for development:

```sh
git clone https://github.com/JunyaoC/poly-encrypt-util.git
cd poly-encrypt-util
yarn install
```

:warning: This project requires `node@20` or higher.

## Scripts

```sh
yarn dev          # Run the code in development mode using swc and nodemon
yarn develop      # Run the code using ts-node/esm loader

yarn test         # Run unit tests
yarn test:watch   # Watch and run unit tests
yarn test:coverage # Run tests with coverage

yarn lint         # Lint the code
yarn lint:fix     # Lint and fix code issues

yarn prettier     # Check code formatting
yarn prettier:write # Format code

yarn type-check   # Run TypeScript type checking

yarn clean        # Remove build and dist directories
yarn build        # Build the project using swc
yarn build:watch  # Watch and build the project

yarn bundle       # Generate CJS and ESM bundles

yarn start:cjs    # Run the CJS bundle
yarn start:esm    # Run the ESM bundle

yarn release      # Run semantic-release for versioning and publishing
```

## Publishing to npm

To publish a new version to npm:

1. Update the version in package.json
2. Run `yarn bundle` to generate the distribution files
3. Run `npm publish`

## License
