function printHelp() {
  console.log(`
Usage:  docker-run-kill [RUN-KILL OPTIONS] [KILL OPTIONS] [RUN OPTIONS] IMAGE [COMMAND] [ARG...]

Run a command in a new container and kill that container when process is terminated.

Run-kill Options:
    --help           Output usage information
    --name string    Assign a name to the container (default is "docker_run_kill_{x}" where {x} is a random number)

Documentation for Kill Options & Run Options can be output with \`docker kill --help\` & \`docker run --help\` \
respectively.

*Important* To assign a name to the container, pass \`--name\` as a Run-kill Option, not a Run Option, \
since the latter won't be recognized.`);
}

module.exports = { printHelp };
