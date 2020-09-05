function parseArgs([...args]) {
  // process "run-kill options"
  let help = undefined;
  let name = undefined;
  while (true) {
    if (args[0] === "--help") {
      help = true;
      args = args.slice(1);
    } else if (args[0] === "--name") {
      name = args[1];
      if (!name) {
        console.error(`flag needs an argument: ${args[0]}`);
        process.exit(1);
      }
      args = args.slice(2);
    } else {
      break;
    }
  }
  const runKillOptions = { help, name };

  // process "kill options"
  let signal = undefined;
  while (true) {
    if (args[0] === "-s" || args[0] === "--signal") {
      signal = args[1];
      if (!signal) {
        console.error(`flag needs an argument: ${args[0]}`);
        process.exit(1);
      }
      args = args.slice(2);
    } else {
      break;
    }
  }
  const killOptions = { signal };

  // remaining args are for "docker run"
  const runArgs = args;

  return { runKillOptions, killOptions, runArgs };
}

module.exports = { parseArgs };
