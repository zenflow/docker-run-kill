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

describe("cli", () => {
  it("child exit (don't kill container)", async () => {
    // TODO: Why does this test take so long, especially in Github Actions?
    jest.setTimeout(10000);
    const script = "console.log('hello')";
    const cp = spawnBin([
      "--name",
      "hello",
      "--rm",
      dockerNodeImage,
      "-e",
      script
    ]);
    const cph = getChildProcessHelpers(cp);
    await cph.outputEnded;
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name hello --rm ${dockerNodeImage} -e ${script}`,
      "hello",
      "",
      ""
    ]);
    await cph.childExited;
    expect(cp.exitCode).toBe(0);
  });
  it("signal exit (kill container)", async () => {
    const script =
      "console.log('hello');process.on('SIGTERM',()=>{console.log('goodbye');process.exit();});setInterval(()=>{},1000)";
    const cp = spawnBin([
      "--name",
      "hello-goodbye",
      "--signal",
      "SIGTERM",
      "--rm",
      dockerNodeImage,
      "-e",
      script
    ]);
    const cph = getChildProcessHelpers(cp);
    await cph.when(line => line === "hello");
    expect(cph.readOutput()).toStrictEqual([
      `> docker run --name hello-goodbye --rm ${dockerNodeImage} -e ${script}`,
      "hello"
    ]);
    cp.kill("SIGINT");
    await cph.outputEnded;
    if (isWindows) {
      expect(cph.readOutput()).toStrictEqual(["", ""]);
      spawnSync("docker", ["kill", "hello-goodbye"]);
    } else {
      expect(cph.readOutput()).toStrictEqual([
        "goodbye",
        "Killed container hello-goodbye",
        "",
        ""
      ]);
    }
    await cph.childExited;
    expect(cp.exitCode).toBe(isWindows ? null : 130);
  });
  it("help", async () => {
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
