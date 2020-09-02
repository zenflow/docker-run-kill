const { logSpawn } = require("./logSpawn");

let exiting = false;

function exit(exitFn) {
  if (!exiting) {
    exiting = true;
    exitFn();
  }
}

function childExit(code) {
  exit(() => process.exit(code));
}

function signalExit(signal, containerName) {
  exit(() => {
    const cp = logSpawn(["docker", "kill", containerName]);
    const done = () => process.exit(128 + signal);
    cp.once("error", done);
    cp.once("exit", done);
  });
}

module.exports = {
  childExit,
  signalExit
};
