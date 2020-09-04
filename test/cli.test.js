const { spawn, spawnSync } = require("child_process");
const { join } = require("path");
const { getChildProcessHelpers } = require("./util/getChildProcessHelpers");

describe("cli", () => {
  it("child exit (don't kill container)", async () => {
    const runArgs = ["--rm", "node:alpine", "-e", "console.log('hello')"];
    const cp = spawnBin(["--name", "hello", ...runArgs]);
    const cph = getChildProcessHelpers(cp);
    await cph.outputEnded;
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name hello ${runArgs.join(" ")}`,
      "hello",
      "",
      ""
    ]);
    await cph.childExited;
    expect(cp.exitCode).toBe(0);
    expect(cp.signalCode).toBeNull();
  });
  it("signal exit (kill container)", async () => {
    const killArgs = ["--signal", "SIGTERM"];
    const runArgs = [
      "--rm",
      "node:alpine",
      "-e",
      "console.log('hello');process.on('SIGTERM',()=>{console.log('goodbye');process.exit();});setInterval(()=>{},1000)"
    ];
    const cp = spawnBin(["--name", "hello-goodbye", ...killArgs, ...runArgs]);
    const cph = getChildProcessHelpers(cp);
    await cph.when(line => line === "hello");
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name hello-goodbye ${runArgs.join(" ")}`,
      "hello"
    ]);
    cp.kill("SIGINT");
    await cph.outputEnded;
    // On Windows, for whatever reason, `cp.kill("SIGINT")` does not result in the child's SIGINT handler being called,
    //   but instead the immediate termination of the child.
    if (process.platform === "win32") {
      expect(cph.readOutput()).toStrictEqual(["", ""]);
      spawnSync("docker", ["kill", "hello-goodbye"]);
    } else {
      expect(cph.readOutput()).toStrictEqual([
        `> docker kill ${killArgs.join(" ")} hello-goodbye`,
        "hello-goodbye",
        "",
        ""
      ]);
    }
    await cph.childExited;
    expect(cp.exitCode).toBeNull();
    expect(cp.signalCode).toBe("SIGINT");
  });
  it("help", async () => {
    const { stdout, stderr, status, signal } = spawnBinSync(["--help"]);
    expect(stdout.toString("utf8")).toMatchInlineSnapshot(`
      "
      Usage:  docker-run-kill [RUN-KILL OPTIONS] [KILL OPTIONS] [RUN OPTIONS] IMAGE [COMMAND] [ARG...]

      Run a command in a new container and kill that container when process is terminated.

      Run-kill Options:
          --help           Output usage information
          --name string    Assign a name to the container (default is \\"docker_run_kill_{x}\\" where {x} is a random number)

      Documentation for Kill Options & Run Options can be output with \`docker kill --help\` & \`docker run --help\` respectively.

      *Important* To assign a name to the container, pass \`--name\` as a Run-kill Option, not a Run Option, since the latter won't be recognized.
      "
    `);
    expect(stderr.toString("utf8")).toBe("");
    expect(status).toBe(0);
    expect(signal).toBeNull();
  });
});

function spawnBin(args) {
  return spawn(process.execPath, [join(__dirname, "../bin.js"), ...args]);
}

function spawnBinSync(args) {
  return spawnSync(process.execPath, [join(__dirname, "../bin.js"), ...args]);
}
