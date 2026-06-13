#!/usr/bin/env node

const pm = process.env.npm_execpath || '';

console.log('🔍 Checking package manager...');

if (!pm.includes('pnpm')) {
    console.error('❌ This project uses pnpm. Please install and use pnpm:');
    console.error('');
    console.error('  npm install -g pnpm');
    console.error('  pnpm install');
    console.error('');
    process.exit(1);
}

const version = process.versions.node;
const [major] = version.split('.');

if (parseInt(major) < 18) {
    console.error(`❌ Node.js version ${version} is not supported.`);
    console.error('Please use Node.js >= 18.0.0');
    console.error('');
    process.exit(1);
}

console.log('✅ Package manager check passed!');