# TODO

- change docker image for tests+demo ("node:alpine") to a specific version,
which is pulled (i.e. `docker pull ...`) in package "postinstall"
- run tests in Github Actions (linux)
- set up semantic release
- README
  - Intro section (explain purpose)
  - Install section (system requirements & `npm install docker-run-kill`)
  - Usage section (show output from `docker-run-kill --help`)
- extract test/util/getChildProcessHelpers.ts to separate package
