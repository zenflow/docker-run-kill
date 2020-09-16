const { spawn, execFile } = require("child_process");
const { parseArgs } = require("./parseArgs");
const { helpText } = require("./helpText");

const SIGNAL_CODES = { SIGINT: 2, SIGTERM: 15 };

let exiting = false;
let runProcExited = false;

function cli(argv) {
  const { runKillOptions, killOptions, runArgs } = parseArgs(argv);
  if (runKillOptions.help) {
    console.log(helpText);
    return;
  }
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
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
    process.exitCode = 1;
    cleanup();
  });
  runProc.once("exit", code => {
    runProcExited = true;
    if (exiting) return;
    process.exitCode = code;
    cleanup();
  });
  Object.keys(SIGNAL_CODES).forEach(signal =>
    process.once(signal, () => handleSignal(runProc, name, killOptions, signal))
  );
  if (process.stdin.isTTY) {
    process.stdin.on("data", data => {
      if (data.toString("utf8") === "\u0003") {
        handleSignal(runProc, name, killOptions, "SIGINT");
      }
    });
  }
}

function handleSignal(runProc, name, killOptions, signal) {
  if (exiting) return;
  exiting = true;
  const options = killOptions.signal ? ["--signal", killOptions.signal] : [];
  execFile("docker", ["kill", ...options, name], {}, error => {
    if (!error) {
      console.log(`Sent ${killOptions.signal || "SIGKILL"} to ${name}`);
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
    process.exitCode = 128 + SIGNAL_CODES[signal];
    cleanup();
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

function cleanup() {
  if (process.stdin.isTTY) {
    process.stdin.destroy();
  }
}

module.exports = { cli };
