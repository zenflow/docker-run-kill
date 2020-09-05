const { spawn, execFile } = require("child_process");
const { parseArgs } = require("./parseArgs");
const { helpText } = require("./helpText");

let exiting = false;

function cli(argv) {
  const { runKillOptions, killOptions, runArgs } = parseArgs(argv.slice(2));
  if (runKillOptions.help) {
    console.log(helpText);
    return;
  }
  const name =
    runKillOptions.name ||
    `docker_run_kill_${Math.floor(Math.random() * 9999999)}`;
  const command = ["docker", "run", "--name", name, ...runArgs];
  console.log(formatCommand(command));
  const runProc = spawnCommand(command, { stdio: "inherit" });
  runProc.once("error", error => {
    console.error(`Error spawning docker process: ${error.code}`);
    process.exit(1);
  });
  runProc.once("exit", code => {
    if (exiting) return;
    process.exit(code);
  });
  process.once("SIGINT", () => handleSignal(name, killOptions, 2));
  process.once("SIGTERM", () => handleSignal(name, killOptions, 15));
}

function handleSignal(name, killOptions, signalCode) {
  if (exiting) return;
  exiting = true;
  const options = killOptions.signal ? ["--signal", killOptions.signal] : [];
  execFile("docker", ["kill", ...options, name], {}, error => {
    if (error) {
      console.error(error.message);
      // TODO: kill runProc if not exited, maybe needed for Linux
    } else {
      console.log(`Killed container ${name}`);
    }
    process.exit(128 + signalCode);
  });
}

function formatCommand(command) {
  return `> ${command
    .map(part => (part.includes(" ") ? JSON.stringify(part) : part))
    .join(" ")}`;
}

function spawnCommand(command, options) {
  const [bin, ...args] = command;
  return spawn(bin, args, options);
}

module.exports = { cli };
