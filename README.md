# ScheduleMe

## Before cloning the repo:

* Install Node.js https://nodejs.org
* `npm install -g bower grunt-cli`

## Every time you pull changes:

* `npm install`
* `bower install`
* `grunt` (TODO: use `grunt` to execute the previous two commands as well)

## Structure

* `public/`: Static files such as JavaScript, images, CSS, fonts, etc. Files
  in this directory are available at `/static/` client-side.
  * `js/`
  * `css/`
  * `images/`
  * `lib/`: 3rd-party library files. This folder should be modified only
    by Gruntfile.js, which is executed using grunt and copies the necessary
    files from `bower_components`.
* `routes/`: Instead of assigning all routes in `index.js`, create a router
for each part of the application in separate files here and then
mount them in `index.js`. See how CAS works for an example.
* `scripts/`: Development utilities.
* `views/`: Application pages to be rendered using `handlebars.js`.
  * `layouts;` Templates to be used for rendering multiple pages.

## Using CAS

CAS authentication only works with `gatech.edu` subdomains. Thankfully, every
computer on Georgia Tech's network is assigned a domain name. Running
`node scripts/dns.js` will print all `gatech.edu` subdomains currently
assigned to your computer. Use these instead of `localhost` or `127.0.0.1`.
If you're not on a Georgia Tech network, you can either VPN into it or
temporarily disable CAS by commenting out the line `app.use('/*', cas);`
in `index.js`.

CAS code is adapted from https://github.gatech.edu/gtjourney/express-casify.

## Misc

### Adding packages

* Pass the `-S` flag to `npm install ...` to save the package as an application
  dependency in `package.json`.
* Pass the `-D` flag to `npm install ...` to save the package as a development
  dependency in `package.json` (e.g., grunt modules).
