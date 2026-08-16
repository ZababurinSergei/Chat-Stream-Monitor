#!/usr/bin/env node

import {createRequire} from 'module';
import ora from 'ora';
import dirTree from 'directory-tree';
import {Command} from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'path';
import {exec, spawn} from 'node:child_process';
import dotenv from "dotenv"
import readline from 'readline';
import {stdin as input, stdout as output} from 'process';
import ansis from 'ansis';
const require = createRequire(import.meta.url);
const __dirname = process.cwd();
const prompt = inquirer.prompt;
const program = new Command();

let define = {}

function color(str, color, type) {
    return typeof ansis[color] === 'function' ? `${ansis[color](str)}` : `${ansis.hex(color).open}${str}${ansis.hex(color).close}`;
}

program
    .version('1.0.0')
    .description('Configuration env files creator.')
program
    .option('--list', 'List tools available')
    .option('--dry-run', 'Dry run')
    .option('--tools <TOOLS>', 'version tools')
    .option('--versions <VERSIONS>', 'Tool version(s)')
    .option('--env ENV', 'Environment (stg, prd)')
    .description('Tool to compile to WebAssembly.')
    .action(async (options, cmd) => {
        let {tools, versions, list, dry_run} = options;
        dotenv.config();
        for (const k in process.env) {
            if (k.startsWith('REACT_APP_') || k.startsWith('PUBLIC_URL') || k.startsWith('PORT') || k.startsWith('WEB_APP')) {
                define[k] = process.env[k];
            }
        }

        const envJSON = path.join(__dirname, './env.json')

        console.log('define', define)

        if(!fs.existsSync(envJSON)) {
            console.log(color(`${envJSON} Должен существовать файл env.json`, 'red', 'program.action_3'))
            process.exit(1)
        } else {
            const spinner = ora().start();
            fs.writeFile(path.join(__dirname, './env.json'), JSON.stringify(define), err => {
                if (err) {
                    console.error(err);
                    process.exit(1)
                }
                spinner.stop().clear()
                console.log(color(`${envJSON} file written successfully`, 'green'))
                process.exit(0)
            });
        }
    });

program.parse(process.argv);