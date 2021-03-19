# API
This software provides the REST API to access MyLife data.  (Client-side applications should never query the underlying MongoDB database directly.)

## Quick Start

### From the Host Computer (Without Docker)
To run `api` directly from the host computer:

1. Launch the `db`.  (See [common](https://github.com/alazhar-shamshuddin-mylife/common) for how to do this using Docker.)

2. Ensure your current working directory is the `api` repository.

3. Export the environment variables used by Docker so that they are accessible to your current shell.  We require the following environment variables:
    - API_PORT
    - DB_API_USERNAME
    - DB_API_PASSWORD
    - DB_HOST
    - DB_PORT

    `set -o allexport && . ../common/.env && set +o allexport`

4. Install the required node modules:

    `npm install`

5. Start the `api` service:

    - `npm run dev` (for development purposes)
    - `npm run start` (for non-development purposes; this `api` is not production ready yet)

### With Docker
To launch the `api` and `db` Docker services for development purposes, see the Quick Start instructions in [common](https://github.com/alazhar-shamshuddin-mylife/common#quick-start).

## Testing

The `api` uses [Jest](https://jestjs.io/) and a temporary [MongoDB In-Memory Server](https://github.com/nodkz/mongodb-memory-server) for testing purposes.  (The `db` service is not used, and hence there is no risk of contaminating production data.)

Run the test suites using the following command: `npx jest test`.