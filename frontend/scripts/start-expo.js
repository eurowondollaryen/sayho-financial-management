#!/usr/bin/env node

const { spawn } = require("child_process");
const { getDevHost } = require("./get-dev-host");

function runExpo(argumentsFromCli, env) {
  const cliPath = require.resolve("expo/bin/cli");
  const childProcess = spawn(process.execPath, [cliPath, "start", ...argumentsFromCli], {
    stdio: "inherit",
    env,
  });

  childProcess.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

function prepareEnvironment() {
  const env = { ...process.env };
  const host = getDevHost();

  if (!host) {
    console.warn(
      "[expo] Unable to automatically determine a private IPv4 address. " +
        "Falling back to Expo defaults. Set DEV_SERVER_HOST manually if needed."
    );
    return env;
  }

  env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
  env.EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0";
  if (!env.EXPO_PUBLIC_API_BASE_URL) {
    env.EXPO_PUBLIC_API_BASE_URL = `http://${host}:8000`;
  }

  console.log(`[expo] Using development server host ${host}`);

  return env;
}

function main() {
  const env = prepareEnvironment();
  const additionalArgs = process.argv.slice(2);
  runExpo(additionalArgs, env);
}

main();
