const { spawn } = require("child_process");

function logSpawn(command, options = {}) {
  const formattedCommand = command
    .map(part => (part.includes(" ") ? JSON.stringify(part) : part))
    .join(" ");
  process.stdout.write(`> ${formattedCommand}\n`);
  const [bin, ...args] = command;
  return spawn(bin, args, { stdio: "inherit", ...options });
}

module.exports = { logSpawn };
