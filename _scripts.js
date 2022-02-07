#!/usr/bin/env node
'use strict';
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const {spawn} = require('child_process');
const path = require('path');
require('dotenv').config();

const commandlineArgs = process.argv.slice(2);

function parseArgs(rawArgs, numFixedArgs, expectedOptions) {
  const fixedArgs = [];
  const options = {};
  const extra = [];
  const alreadyCounted = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const rawArg = rawArgs[i];
    if (rawArg.startsWith('--')) {
      const optionName = rawArg.slice(2);
      const optionDetected = expectedOptions[optionName];
      if (!alreadyCounted[optionName] && optionDetected) {
        alreadyCounted[optionName] = true;
        if (optionDetected === 'boolean') {
          options[optionName] = true;
        } else {
          i++;
          options[optionName] = rawArgs[i];
        }
      } else {
        if (fixedArgs.length < numFixedArgs) {
          throw new Error(`expected ${numFixedArgs} fixed args, got only ${fixedArgs.length}`);
        } else {
          extra.push(rawArg);
        }
      }
    } else {
      if (fixedArgs.length < numFixedArgs) {
        fixedArgs.push(rawArg);
      } else {
        for (const opt of Object.keys(expectedOptions)) {
          alreadyCounted[opt] = true;
        }
        extra.push(rawArg);
      }
    }
  }
  return {options, extra, fixedArgs};
}

function execute(command) {
  return new Promise((resolve, reject) => {
    const onExit = (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    };
    spawn(command.split(' ')[0], command.split(' ').slice(1), {
      stdio: 'inherit',
      shell: true,
    }).on('exit', onExit);
  });
}

async function performAction(rawArgs) {
  const firstArg = rawArgs[0];
  const args = rawArgs.slice(1);
  if (firstArg === 'run') {
    const {fixedArgs, extra} = parseArgs(args, 2, {});
    let filepath = fixedArgs[1];
    const folder = path.basename(__dirname);
    if (filepath.startsWith(folder + '/') || filepath.startsWith(folder + '\\')) {
      filepath = filepath.slice(folder.length + 1);
    }
    await execute(
      `cross-env HARDHAT_DEPLOY_LOG=true HARDHAT_NETWORK=${fixedArgs[0]} ts-node --files ${filepath} ${extra.join(' ')}`
    );
  }
}

performAction(commandlineArgs);
