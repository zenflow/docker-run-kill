const dockerNodeImage = "node:10.22.0-alpine3.9";

const { spawn, spawnSync } = require("child_process");
const { join } = require("path");
const { once } = require("events");
const { StreamLineReader } = require("stream-line-reader");
const { helpText } = require("../lib/helpText");

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
    const lines = new StreamLineReader([cp.stdout, cp.stderr]);
    expect(await lines.readRemaining()).toStrictEqual([
      `> docker run --name ${containerName} --rm ${dockerNodeImage} -e console.log('hello')`,
      "hello",
      "",
      ""
    ]);
    await once(cp, "exit");
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
      const lines = new StreamLineReader([cp.stdout, cp.stderr]);
      expect(await lines.readUntil(line => line === "hello")).toStrictEqual([
        `> docker run --name ${containerName} --rm ${dockerNodeImage} -e ${helloGoodbyeScript}`,
        "hello"
      ]);
      cp.kill(signal);
      if (isWindows) {
        await expectWindowsEarlyExit(lines);
        return;
      }
      expect(await lines.readRemaining()).toStrictEqual([
        `Sent SIGKILL to ${containerName}`,
        "",
        ""
      ]);
      await once(cp, "exit");
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
    const lines = new StreamLineReader([cp.stdout, cp.stderr]);
    expect(await lines.readUntil(line => line === "hello")).toStrictEqual([
      `> docker run --name ${containerName} --rm ${dockerNodeImage} -e ${helloGoodbyeScript}`,
      "hello"
    ]);
    cp.kill("SIGTERM");
    if (isWindows) {
      await expectWindowsEarlyExit(lines);
      return;
    }
    expect(await lines.readRemaining()).toStrictEqual([
      "goodbye SIGINT", // signal indicated with --signal
      `Sent SIGINT to ${containerName}`,
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
    const lines = new StreamLineReader([cp.stdout, cp.stderr]);
    expect(await lines.readUntil(line => line === "hello")).toStrictEqual([
      `> docker run --name ${containerName} --rm ${dockerNodeImage} -e ${helloGoodbyeScript}`,
      "hello"
    ]);
    cp.kill("SIGTERM");
    if (isWindows) {
      await expectWindowsEarlyExit(lines);
      return;
    }
    expect(await lines.readRemaining()).toStrictEqual([
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

async function expectWindowsEarlyExit(lines) {
  expect(await lines.readRemaining()).toStrictEqual(["", ""]);
  spawnSync("docker", ["kill", containerName]); // clean up
}
