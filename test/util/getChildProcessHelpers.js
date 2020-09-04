const { once } = require("events");
const merge = require("merge-stream");
const split = require("split");

function getChildProcessHelpers(cp) {
  const outputStream = merge([
    cp.stdout.setEncoding("utf8").pipe(split()),
    cp.stderr.setEncoding("utf8").pipe(split())
  ]);
  const output = [];
  outputStream.on("data", line => output.push(line));
  const readOutput = () => output.splice(0, output.length);
  const when = getWhen(outputStream, output);
  const outputEnded = once(outputStream, "end");
  const childExited = once(cp, "exit");
  return { readOutput, when, outputEnded, childExited };
}

function getWhen(outputStream, output) {
  return cb => {
    return new Promise((resolve, reject) => {
      function onError(error) {
        cleanup();
        reject(error);
      }

      function onData(line) {
        if (cb(line)) {
          cleanup();
          resolve();
        }
      }

      function onEnd() {
        cleanup();
        console.error("Output:", [...output]);
        reject(new Error(`Output ended before encountering line ${cb}`));
      }

      function cleanup() {
        outputStream.off("error", onError);
        outputStream.off("data", onData);
        outputStream.off("end", onEnd);
      }

      outputStream.on("error", onError);
      outputStream.on("data", onData);
      outputStream.on("end", onEnd);
    });
  };
}

module.exports = { getChildProcessHelpers };
