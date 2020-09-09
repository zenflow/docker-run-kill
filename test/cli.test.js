/*
  Note: On Windows, for whatever reason, calling `cp.kill("SIGINT")`
  does not result in the child's SIGINT handler being called,
  but instead the immediate termination of the child.
 */

const dockerNodeImage = "node:10.22.0-alpine3.9";

const { spawn, spawnSync } = require("child_process");
const { join } = require("path");
const { helpText } = require("../lib/helpText");
const { getChildProcessHelpers } = require("./util/getChildProcessHelpers");

const isWindows = process.platform === "win32";
const containerName = "docker-run-kill-test";
const helloGoodbyeScript =
  "console.log('hello');" +
  "['SIGINT','SIGTERM'].forEach(signal=>{" +
  "process.on(signal,()=>{" +
  "console.log('goodbye',signal);" +
  "process.exit();" +
  "});" +
  "});" +
  "setInterval(()=>{},1000)";

describe("cli", () => {
  jest.setTimeout(10000);

  it("skips killing container when container exits by itself", async () => {
    // TODO: Why does this test take so long, especially in Github Actions?
    const cp = spawnBin([
      "--name",
      containerName,
      "--rm",
      dockerNodeImage,
      "-e",
      "console.log('hello')"
    ]);
    const cph = getChildProcessHelpers(cp);
    await cph.outputEnded;
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name ${containerName} --rm ${dockerNodeImage} -e console.log('hello')`,
      "hello",
      "",
      ""
    ]);
    await cph.childExited;
    expect(cp.exitCode).toBe(0);
  });

  for (const [signal, exitCode] of [
    ["SIGINT", 130],
    ["SIGTERM", 143]
  ]) {
    it(`kills container on ${signal}`, async () => {
      const cp = spawnBin([
        "--name",
        containerName,
        "--rm",
        dockerNodeImage,
        "-e",
        helloGoodbyeScript
      ]);
      const cph = getChildProcessHelpers(cp);
      await cph.when(line => line === "hello");
      expect(cph.readOutput()).toStrictEqual([
        `> docker run --name ${containerName} --rm ${dockerNodeImage} -e ${helloGoodbyeScript}`,
        "hello"
      ]);
      cp.kill(signal);
      await cph.outputEnded;
      if (expectWindowsEarlyExit(cph)) {
        return;
      }
      expect(cph.readOutput()).toStrictEqual([
        `Killed container ${containerName} with signal SIGKILL (default)`,
        "",
        ""
      ]);
      await cph.childExited;
      expect(cp.exitCode).toBe(exitCode);
    });
  }

  it("kills container with given --signal", async () => {
    const cp = spawnBin([
      "--name",
      containerName,
      "--signal",
      "SIGINT",
      "--rm",
      dockerNodeImage,
      "-e",
      helloGoodbyeScript
    ]);
    const cph = getChildProcessHelpers(cp);
    await cph.when(line => line === "hello");
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name ${containerName} --rm ${dockerNodeImage} -e ${helloGoodbyeScript}`,
      "hello"
    ]);
    cp.kill("SIGTERM");
    await cph.outputEnded;
    if (expectWindowsEarlyExit(cph)) {
      return;
    }
    expect(cph.readOutput()).toStrictEqual([
      "goodbye SIGINT", // signal indicated with --signal
      `Killed container ${containerName} with signal SIGINT`,
      "",
      ""
    ]);
  });

  it("reports error killing container", async () => {
    const cp = spawnBin([
      "--name",
      containerName,
      "--signal",
      "INVALID_SIGNAL",
      "--rm",
      dockerNodeImage,
      "-e",
      helloGoodbyeScript
    ]);
    const cph = getChildProcessHelpers(cp);
    await cph.when(line => line === "hello");
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name ${containerName} --rm ${dockerNodeImage} -e ${helloGoodbyeScript}`,
      "hello"
    ]);
    cp.kill("SIGTERM");
    await cph.outputEnded;
    if (expectWindowsEarlyExit(cph)) {
      return;
    }
    expect(cph.readOutput()).toStrictEqual([
      `Command failed: docker kill --signal INVALID_SIGNAL ${containerName}`,
      "Error response from daemon: Invalid signal: INVALID_SIGNAL",
      "goodbye SIGTERM", // signal which child process was killed with
      "",
      ""
    ]);
  });

  it("can print help text", async () => {
    const { stdout, stderr, status } = spawnBinSync(["--help"]);
    expect(stdout.toString("utf8")).toBe(`${helpText}\n`);
    expect(stderr.toString("utf8")).toBe("");
    expect(status).toBe(0);
  });
});

function spawnBin(args) {
  return spawn(process.execPath, [join(__dirname, "../bin.js"), ...args]);
}

function spawnBinSync(args) {
  return spawnSync(process.execPath, [join(__dirname, "../bin.js"), ...args]);
}

function expectWindowsEarlyExit(cph) {
  if (!isWindows) return false;
  expect(cph.readOutput()).toStrictEqual(["", ""]);
  spawnSync("docker", ["kill", containerName]); // clean up
  return true;
}
