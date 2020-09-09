function parseArgs([...args]) {
  const runKillOptions = getRunKillOptions(args);
  const killOptions = getKillOptions(args);
  const runArgs = args; // remaining args are for "docker run"
  return { runKillOptions, killOptions, runArgs };
}

function getRunKillOptions(args) {
  let help = undefined;
  let name = undefined;
  while (true) {
    if (args[0] === "--help") {
      help = true;
      args.shift();
    } else if (args[0] === "--name") {
      name = getFlagArgument(args);
    } else {
      return { help, name };
    }
  }
}

function getKillOptions(args) {
  let signal = undefined;
  while (true) {
    if (args[0] === "-s" || args[0] === "--signal") {
      signal = getFlagArgument(args);
    } else {
      return { signal };
    }
  }
}

function getFlagArgument(args) {
  const [flag, argument] = args.splice(0, 2);
  if (!argument) {
    console.error(`flag needs an argument: ${flag}`);
    process.exit(1);
  }
  return argument;
}

module.exports = { parseArgs };
