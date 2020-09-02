const { logSpawn } = require("./logSpawn");
const { childExit, signalExit } = require("./exit");

function cli(argv) {
  let [node, script, ...args] = argv;
  console.log(JSON.stringify({ node, script, args })); // TODO: remove after debugging
  // TODO: error if args includes any incompatible options (--detach)
  // TODO: detect -h & print help (/w docker run help)
  // TODO: get `--signal` for `docker kill` from `args`
  const containerName = `docker_run_kill_${Math.floor(
    Math.random() * 9999999
  )}`;
  args = ["--name", containerName, ...args];
  // TODO: use given `--name` when possible

  const cp = logSpawn(["docker", "run", ...args]);
  cp.once("error", error => {
    throw error;
  });
  cp.once("exit", code => childExit(code));
  process.once("SIGINT", () => signalExit(2, containerName));
  process.once("SIGTERM", () => signalExit(15, containerName));
}

module.exports = { cli };
