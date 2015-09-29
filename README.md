# Server Monitor

A first pass at a hardware monitoring solution for my Windows NAS. When I moved away from Debian I was lacking a monitoring solution that would poll and store hardware information into a database (that could later be retrieved and displayed on a website). Currently, only the storage side of things are working - have yet to find time to create the front end.

It uses node.JS to handle the server side of things, polls information using Python, stores the data into mongoDB. I was playing around with angular-js on the front end, but the website itself is nowhere close to being complete. This is very much a work in progress.

## Usage

The following must be installed for this to work:

- Python 2.7
- Node.JS
- MongoDB

Node dependencies (can be installed using the package.json file):

- expressJS
- mongodb
- python-shell

Just run server.js using node and all should be good (some config items may need to change, like the database name).