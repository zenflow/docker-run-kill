# docker-run-kill

CLI wrapping `docker run` to kill container when CLI is terminated

[![npm stats](https://nodei.co/npm/docker-run-kill.png?compact=true)](http://npmjs.com/package/docker-run-kill)

[![CI status](https://img.shields.io/github/workflow/status/zenflow/docker-run-kill/CI?logo=GitHub&label=CI)](https://github.com/zenflow/docker-run-kill/actions?query=branch%3Amaster)
[![dependencies status](https://img.shields.io/david/zenflow/docker-run-kill)](https://david-dm.org/zenflow/docker-run-kill)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/zenflow/docker-run-kill?logo=Code%20Climate)](https://codeclimate.com/github/zenflow/docker-run-kill)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues welcome](https://img.shields.io/badge/issues-welcome-brightgreen.svg?logo=GitHub)](https://github.com/zenflow/docker-run-kill/issues)
[![GitHub pull requests welcome](https://img.shields.io/badge/pull%20requests-welcome-brightgreen.svg?logo=GitHub)](https://github.com/zenflow/docker-run-kill/pulls)

## What is it?

Terminating a `docker run` command does not always result in the container being killed.
This CLI fixes that by wrapping `docker run` and killing the container before exiting when a termination signal is received.

## Installation

npm

```
$ npm install docker-run-kill
```

yarn

```
$ yarn add docker-run-kill
```

## Usage

```
$ docker-run-kill --help

Usage:  docker-run-kill [RUN-KILL OPTIONS] [KILL OPTIONS] [RUN OPTIONS] IMAGE [COMMAND] [ARG...]

Run a command in a new container and kill that container when process is terminated.

Run-kill Options:
    --help           Output usage information
    --name string    Assign a name to the container (default is "docker_run_kill_{x}" where {x} is a random number)

Documentation for Kill Options & Run Options can be output with `docker kill --help` & `docker run --help` respectively.

*Important* To assign a name to the container, pass `--name` as a Run-kill Option, not a Run Option, since the latter won't be recognized.
```
