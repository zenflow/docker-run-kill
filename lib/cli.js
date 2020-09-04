const { parseArgs } = require("./parseArgs");
const { printHelp } = require("./printHelp");
const { logSpawn } = require("./logSpawn");

let exiting = false;

function cli(argv) {
  const { runKillOptions, killOptions, runArgs } = parseArgs(argv.slice(2));
  if (runKillOptions.help) {
    printHelp();
    return;
  }
  const containerName =
    runKillOptions.name ||
    `docker_run_kill_${Math.floor(Math.random() * 9999999)}`;
  const runCommand = ["docker", "run", "--name", containerName, ...runArgs];
  const killCommand = [
    "docker",
    "kill",
    ...(killOptions.signal ? ["--signal", killOptions.signal] : []),
    containerName
  ];
  const cp = logSpawn(runCommand);
  cp.once("error", error => {
    throw error;
  });
  cp.once("exit", code => {
    if (!exiting) {
      process.exit(code);
    }
  });
  process.once("SIGINT", () => signalExit(killCommand, 2));
  process.once("SIGTERM", () => signalExit(killCommand, 15));
}

function signalExit(killCommand, signal) {
  if (!exiting) {
    exiting = true;
    const cp = logSpawn(killCommand);
    const done = () => process.exit(128 + signal);
    cp.once("error", done);
    cp.once("exit", done);
  }
}

module.exports = { cli };
