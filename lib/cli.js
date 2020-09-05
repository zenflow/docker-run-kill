const { spawn, execFile } = require("child_process");
const { parseArgs } = require("./parseArgs");
const { helpText } = require("./helpText");

const signalCodes = { SIGINT: 2, SIGTERM: 15 };

let exiting = false;
let runProcExited = false;

function cli(argv) {
  const { runKillOptions, killOptions, runArgs } = parseArgs(argv);
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
    // TODO: what if error is from trying to kill the process (below)?
    console.error(`Error spawning docker process: ${error.code}`);
    process.exit(1);
  });
  runProc.once("exit", code => {
    runProcExited = true;
    if (exiting) return;
    process.exit(code);
  });
  Object.keys(signalCodes).forEach(signal =>
    process.once(signal, () => handleSignal(runProc, name, killOptions, signal))
  );
}

function handleSignal(runProc, name, killOptions, signal) {
  if (exiting) return;
  exiting = true;
  const options = killOptions.signal ? ["--signal", killOptions.signal] : [];
  execFile("docker", ["kill", ...options, name], {}, error => {
    if (!error) {
      console.log(`Killed container ${name}`);
      exit();
    } else {
      console.error(error.message.trim());
      if (runProcExited) {
        exit();
      } else {
        runProc.kill(signal);
        runProc.once("exit", exit);
      }
    }
  });
  function exit() {
    process.exit(128 + signalCodes[signal]);
  }
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
