const { spawn } = require("child_process");
const { join } = require("path");
const { cli } = require("./cli");

const cliArgs = [
  "--signal",
  "SIGINT",
  "--rm",
  "node:10.22.0-alpine3.9",
  "-e",
  `\
console.log('hello');
process.on('SIGINT', () => {
  console.log('got SIGINT');
  const exit = () => {
    console.log('goodbye');
    process.exit(130);
  }
  setTimeout(exit, 500)
});
setInterval(()=>{}, 1000);`
];
const [, , demoName = "direct", ...demoArgs] = process.argv;

const demos = {
  direct: () => {
    cli(cliArgs);
  },
  spawn: () => {
    const isRaw = demoArgs.includes("--raw");
    const child = spawn(
      process.execPath,
      [join(__dirname, "bin.js"), ...cliArgs],
      {
        stdio: ["pipe", "inherit", "inherit"]
      }
    );
    process.on("SIGINT", () => {}); // disable default SIGINT handler
    if (isRaw) {
      process.stdin.setRawMode(true);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        process.stdin.destroy();
        child.kill("SIGINT");
      };
      process.stdin.on("data", data => {
        if (data.toString("utf8") === "\u0003") {
          finish();
        }
      });
      process.on("SIGINT", finish);
    }
  }
};

const demo = demos[demoName];
if (typeof demo !== "function") {
  throw new Error(`Unknown demo "${demoName}"`);
}
demo();
