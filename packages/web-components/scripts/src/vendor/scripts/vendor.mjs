import{unlinkSync as I,readFileSync as D,writeFileSync as F,existsSync as V,mkdirSync as E,statSync as w,readdirSync as v}from"fs";import{dirname as x,join as $,relative as R,resolve as S}from"path";var a=class{static exists(e){return V(e)}static ensureDir(e){this.exists(e)||E(e,{recursive:!0})}static readFile(e){return D(e,"utf8")}static writeFile(e,t){this.ensureDir(x(e)),F(e,t,"utf8")}static readJson(e){try{let t=this.readFile(e);return JSON.parse(t)}catch(t){return console.warn(`\u274C Failed to read JSON file ${e}:`,t instanceof Error?t.message:"Unknown error"),null}}static writeJson(e,t){this.writeFile(e,JSON.stringify(t,null,2))}static getAllFiles(e,t=[]){let r=[],n=o=>{if(!this.exists(o)){console.warn(`\u26A0\uFE0F Directory does not exist: ${o}`);return}try{let s=v(o,{withFileTypes:!0});for(let i of s){let d=$(o,i.name);i.isDirectory()?!i.name.startsWith(".")&&i.name!=="node_modules"&&i.name!=="dist"&&i.name!=="build"&&i.name!=="coverage"&&n(d):i.isFile()&&(t.length===0||t.some(u=>i.name.endsWith(u)))&&r.push(d)}}catch(s){console.warn(`\u274C Cannot read directory: ${o}`,s instanceof Error?s.message:"Unknown error")}};return n(e),r}static isDirectory(e){try{return w(e).isDirectory()}catch(t){return console.warn(`\u274C Cannot check if path is directory: ${e}`,t instanceof Error?t.message:"Unknown error"),!1}}static getFileSize(e){try{return w(e).size}catch(t){return console.warn(`\u274C Cannot get file size: ${e}`,t instanceof Error?t.message:"Unknown error"),-1}}static copyFile(e,t){try{if(!this.exists(e))return console.warn(`\u274C Source file does not exist: ${e}`),!1;this.ensureDir(x(t));let r=D(e);return F(t,r),console.log(`\u2705 Copied: ${e} \u2192 ${t}`),!0}catch(r){return console.error(`\u274C Failed to copy file ${e} to ${t}:`,r instanceof Error?r.message:"Unknown error"),!1}}static deleteFile(e){try{return this.exists(e)&&(I(e),console.log(`\u{1F5D1}\uFE0F Deleted: ${e}`)),!0}catch(t){return console.error(`\u274C Failed to delete file ${e}:`,t instanceof Error?t.message:"Unknown error"),!1}}static getRelativePath(e,t){return R(e,t)}static resolvePath(...e){return S(...e)}static joinPaths(...e){return $(...e)}static getFileExtension(e){return e.slice(e.lastIndexOf("."))||""}static getFileNameWithoutExtension(e){return(e.split("/").pop()||e.split("\\\\").pop()||e).replace(/\.[^/.]+$/,"")}static getDirectoryContents(e){let t=[],r=[];if(!this.exists(e))return{files:t,directories:r};try{let n=v(e,{withFileTypes:!0});for(let o of n){let s=$(e,o.name);o.isDirectory()?r.push(s):o.isFile()&&t.push(s)}return{files:t,directories:r}}catch(n){return console.error(`\u274C Failed to read directory contents: ${e}`,n instanceof Error?n.message:"Unknown error"),{files:t,directories:r}}}static createFileIfNotExists(e,t=""){if(this.exists(e))return!1;try{return this.writeFile(e,t),console.log(`\u{1F4C4} Created: ${e}`),!0}catch(r){return console.error(`\u274C Failed to create file ${e}:`,r instanceof Error?r.message:"Unknown error"),!1}}static isTypeScriptFile(e){let t=this.getFileExtension(e).toLowerCase();return t===".ts"||t===".tsx"}static isJavaScriptFile(e){let t=this.getFileExtension(e).toLowerCase();return t===".js"||t===".jsx"||t===".mjs"||t===".cjs"}static isSourceFile(e){return this.getFileExtension(e).toLowerCase(),this.isTypeScriptFile(e)||this.isJavaScriptFile(e)}static formatFileSize(e){if(e===0)return"0 B";let t=1024,r=["B","KB","MB","GB"],n=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,n)).toFixed(2))+" "+r[n]}static getFileStats(e){try{let t=w(e);return{size:t.size,created:t.birthtime,modified:t.mtime}}catch(t){return console.warn(`\u274C Cannot get file stats: ${e}`,t instanceof Error?t.message:"Unknown error"),null}}static findFilesByPattern(e,t){return this.getAllFiles(e).filter(n=>t.test(n))}static ensureFileStructure(e){for(let t of e)this.createFileIfNotExists(t.path,t.content)}static backupFile(e,t=".backup"){if(!this.exists(e))return!1;try{let r=e+t;return this.copyFile(e,r)}catch(r){return console.error(`\u274C Failed to backup file ${e}:`,r instanceof Error?r.message:"Unknown error"),!1}}static restoreBackup(e,t=".backup"){let r=e+t;if(!this.exists(r))return console.warn(`\u26A0\uFE0F Backup file does not exist: ${r}`),!1;try{return this.copyFile(r,e)}catch(n){return console.error(`\u274C Failed to restore backup for ${e}:`,n instanceof Error?n.message:"Unknown error"),!1}}static statSync(e){return w(e)}static readDir(e){return v(e,{withFileTypes:!0})}static dirname(e){return x(e)}};var g=class{constructor(e){this.projectRoot=e}async analyzeDependencies(e="browser"){let t=new Map,r=[];console.log("\u{1F4E6} Analyzing package.json dependencies..."),await this.analyzePackageJson(t,e),console.log("\u{1F50D} Scanning source files for imports..."),await this.analyzeSourceImports(t,e),t.size>0?(console.log(`\u{1F4CA} Found ${t.size} external dependencies:`),t.forEach((o,s)=>{let i=o.version!=="unknown"?`@${o.version}`:"(version unknown)";console.log(`   \u{1F4E6} ${s}${i}`)})):console.log("\u2139\uFE0F No external dependencies found");let n=this.generateImportMap(t,e);return{dependencies:t,entryPoints:r,importMap:n,projectRoot:this.projectRoot,analyzedFiles:this.countAnalyzedFiles()}}async analyzePackageJson(e,t){let r=`${this.projectRoot}/package.json`;if(!a.exists(r))return;let n=a.readJson(r);if(!n)return;let o={...n.dependencies,...n.devDependencies,...n.peerDependencies};for(let[s,i]of Object.entries(o))if(this.isExternalDependency(s,t)){let d=this.cleanVersion(i||"unknown");e.set(s,{packageName:s,version:d,importPath:s,isExternal:!0})}}cleanVersion(e){return e.replace(/[^0-9.]/g,"")}async analyzeSourceImports(e,t){let r=a.getAllFiles(this.projectRoot,[".ts",".js",".tsx",".jsx",".mjs",".cjs"]);console.log(`\u{1F50D} Analyzing ${r.length} source files for imports...`);let n=await this.getPackageVersionsFromNodeModules();for(let o of r){let s=this.extractImportsFromFile(o);for(let i of s)if(this.isExternalDependency(i,t)&&!e.has(i)){let d=n.get(i)||this.getFallbackVersion(i);e.set(i,{packageName:i,version:d,importPath:i,isExternal:!0})}}}async getPackageVersionsFromNodeModules(){let e=new Map,t=`${this.projectRoot}/node_modules`;if(!a.exists(t))return e;try{let r=a.readDir(t);for(let o of r)if(o.isDirectory()&&!o.name.startsWith(".")){let s=o.name,i=`${t}/${s}/package.json`;if(a.exists(i)){let d=a.readJson(i);d?.version&&e.set(s,this.cleanVersion(d.version))}}let n=r.filter(o=>o.isDirectory()&&o.name.startsWith("@"));for(let o of n){let s=`${t}/${o.name}`,i=a.readDir(s);for(let d of i)if(d.isDirectory()){let u=`${o.name}/${d.name}`,c=`${s}/${d.name}/package.json`;if(a.exists(c)){let p=a.readJson(c);p?.version&&e.set(u,this.cleanVersion(p.version))}}}}catch(r){console.warn("\u26A0\uFE0F Cannot read node_modules for versions:",r)}return e}getFallbackVersion(e){return{react:"18.0.0","react-dom":"18.0.0",vue:"3.0.0","@libp2p/logger":"1.0.0",lodash:"4.17.0",axios:"1.0.0",express:"4.18.0",typescript:"5.0.0"}[e]||"1.0.0"}extractImportsFromFile(e){let t=new Set;try{let r=a.readFile(e),n=[/from\s+['"]([^'"]+)['"]/g,/import\s+['"]([^'"]+)['"]\s*;/g,/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,/export\s+.*from\s+['"]([^'"]+)['"]/g,/import\s*\(\s*`([^`]+)`\s*\)/g];for(let o of n){let s;for(;(s=o.exec(r))!==null;){let i=s[1];if(i){let d=this.extractPackageName(i);d&&this.isValidPackageName(d)&&t.add(d)}}}}catch(r){console.warn(`\u26A0\uFE0F Cannot analyze imports in ${e}:`,r instanceof Error?r.message:r)}return t}extractPackageName(e){if(e.startsWith(".")||e.startsWith("/")||e.startsWith("http:")||e.startsWith("https:")||e.startsWith("data:")||e.startsWith("#"))return null;if(e.startsWith("@")){let r=e.match(/^(@[^/]+\/[^/@]+)/);return r?r[1]??null:null}let t=e.match(/^([^/@]+)/);return t?t[1]??null:null}isValidPackageName(e){return!(e.length===0||e.length>214||!/^[@a-zA-Z0-9][\w@./-]*$/.test(e)||/^[._-]|[._-]$/.test(e)||/[._-]{2,}/.test(e))}isExternalDependency(e,t){let r=[/^@newkind\//,/^\./,/^\//,/^virtual:/,/^bun:/,/^deno:/,/^http:/,/^https:/,/^data:/,/^#/,/^std:/],n=[/^@types\//,/^node:/,/^fs$/,/^path$/,/^url$/,/^child_process$/,/^os$/,/^crypto$/,/^http$/,/^https$/,/^net$/,/^dns$/,/^util$/,/^stream$/,/^buffer$/,/^events$/,/^module$/,/^assert$/,/^querystring$/,/^zlib$/,/^tls$/,/^cluster$/,/^vm$/,/^perf_hooks$/,/^readline$/,/^repl$/,/^timers$/,/^string_decoder$/,/^worker_threads$/],o=t==="browser"?[/^esbuild$/,/^typescript$/,/^package$/,/^webpack$/,/^rollup$/,/^vite$/]:[/^esbuild$/,/^typescript$/,/^webpack$/,/^rollup$/,/^vite$/,/^jest$/,/^mocha$/,/^chai$/,/^ava$/,/^tape$/,/^nodemon$/,/^pm2$/,/^forever$/,/^sass$/,/^less$/,/^stylus$/,/^postcss$/,/^fs-extra$/,/^chokidar$/];return![...r,...n,...o].some(i=>i.test(e))}generateImportMap(e,t){let r={};for(let[n]of e){let o=t==="node"?"./vendor.mjs":"./vendor.bundle.mjs";r[n]=o,r[`${n}/*`]=o}if(Object.keys(r).length===0){console.log("\u2139\uFE0F No external dependencies found, adding common fallbacks");let n=t==="browser"?["react","react-dom"]:["@libp2p/logger"];for(let o of n){let s=t==="node"?"./vendor.mjs":"./vendor.bundle.mjs";r[o]=s,r[`${o}/*`]=s}}return console.log(`\u{1F5FA}\uFE0F Generated ${t} import map with ${Object.keys(r).length} entries`),{imports:r,scopes:{"./":{...r}}}}countAnalyzedFiles(){try{return a.getAllFiles(this.projectRoot,[".ts",".js",".tsx",".jsx",".mjs",".cjs"]).length}catch{return 0}}async getDependencyStats(e="browser"){let t=await this.analyzeDependencies(e);return{totalDependencies:t.dependencies.size,externalDependencies:Array.from(t.dependencies.values()).filter(r=>r.isExternal).length,packages:Array.from(t.dependencies.keys()).sort()}}};var B={always:["@types/*","node:*","fs","path","url","child_process","os","crypto","http","https","net","dns","util","stream","buffer","events","module","assert","querystring","zlib","tls","cluster","vm","perf_hooks","readline","repl","timers","string_decoder","worker_threads"],browser:["esbuild","typescript","webpack","rollup","vite","jest","mocha","chai","ava","tape","nodemon","pm2","forever","sass","less","stylus","postcss","fs-extra","chokidar"],node:["esbuild","typescript","webpack","rollup","vite","jest","mocha","chai","ava","tape","nodemon","pm2","forever","sass","less","stylus","postcss","fs-extra","chokidar"]};function j(l,e){for(let r of B.always)if(r.includes("*")){if(new RegExp("^"+r.replace(/\*/g,".*")+"$").test(l))return!0}else if(l===r)return!0;let t=B[e];for(let r of t)if(r.includes("*")){if(new RegExp("^"+r.replace(/\*/g,".*")+"$").test(l))return!0}else if(l===r)return!0;return!1}var f=class{constructor(e){this.projectRoot=e}async generateVendorIndex(e,t="browser"){if(e.size===0)return this.generateFallbackIndex(t);let r=new Map;for(let[c,p]of e)this.isValidForBundle(c,t)?r.set(c,p):console.log(`\u{1F6AB} Excluding ${c} from ${t} vendor bundle`);if(r.size===0)return this.generateFallbackIndex(t);let n=[],o=[],s=[],i=[];for(let[c]of r){let p=this.toValidIdentifier(c);if(this.isReservedWord(p)){console.warn(`\u26A0\uFE0F Skipping reserved word: ${c} -> ${p}`);continue}c==="@libp2p/logger"?(n.push("import { logger } from '@libp2p/logger';"),o.push("export { logger };"),o.push(`export const ${p} = { logger };`)):(n.push(`import * as ${p} from '${c}';`),o.push(`export { ${p} };`),c==="react"?s.push(`export const { useState, useEffect, useRef, createElement } = ${p};`):c==="react-dom"&&s.push(`export const { render, createRoot, hydrate } = ${p};`))}i.push(`export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: ${JSON.stringify(Array.from(r.keys()))},
  totalDependencies: ${r.size},
  buildType: 'vendor-bundle',
  platform: '${t}'
};`),i.push(`
// Utility to check if a dependency is available
export function hasDependency(name) {
  return VENDOR_INFO.dependencies.includes(name);
}

// Vendor initialization status
export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: ${r.size}
};`);let d=Array.from(r.keys()).map(c=>{let p=this.toValidIdentifier(c);return this.isReservedWord(p)?null:c==="@libp2p/logger"?"logger":p}).filter(Boolean);return`// Vendor Index - Auto-generated
// External dependencies for the project
// Generated: ${new Date().toISOString()}
// Project: ${this.projectRoot}
// Platform: ${t}

${n.join(`
`)}

${o.join(`
`)}

${s.filter(c=>!c.startsWith("//")).join(`
`)}

${i.join(`
`)}

// Vendor initialization
console.log('\u2705 Vendor index loaded with ${r.size} dependencies:', VENDOR_INFO.dependencies);

// Export everything as a namespace
export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency,
  ${d.join(`,
  `)}
};
`}isValidForBundle(e,t){return!j(e,t)}toValidIdentifier(e){return e.replace(/^@/,"").replace(/[\/\-@\.]/g,"_").replace(/^(\d)/,"_$1").replace(/\s+/g,"_").replace(/_{2,}/g,"_").replace(/_+$/,"")}isReservedWord(e){return["package","function","class","return","if","else","for","while","do","switch","case","default","break","continue","var","let","const","import","export","from","as","in","of","typeof","void","delete","new","this","super","extends","instanceof","try","catch","finally","throw","debugger","with","yield","await","async","static","public","private","protected","interface","implements","enum"].includes(e)}generateFallbackIndex(e){return`// Fallback Vendor Index
// Auto-generated: ${new Date().toISOString()}
// No external dependencies found in project: ${this.projectRoot}
// Platform: ${e}

// Mock implementations for common dependencies
export const libp2pLogger = {
  info: (...args) => console.log('[libp2p]', ...args),
  warn: (...args) => console.warn('[libp2p]', ...args),
  error: (...args) => console.error('[libp2p]', ...args),
  debug: (...args) => console.debug('[libp2p]', ...args),
  trace: (...args) => console.trace('[libp2p]', ...args)
};

export const react = {
  createElement: (...args) => {
    console.warn('\u26A0\uFE0F Using React mock - install react package for full functionality');
    return { type: 'mock-element', props: args[1], children: args[2] };
  },
  useState: (initial) => [initial, () => {}],
  useEffect: (fn, deps) => fn(),
  useRef: (initial) => ({ current: initial })
};

export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: [],
  totalDependencies: 0,
  buildType: 'fallback-vendor',
  platform: '${e}',
  usingMocks: true
};

export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: 0,
  usingFallback: true
};

// Utility functions
export function hasDependency(name) {
  return false;
}

export function getDependencyInfo(name) {
  return { available: false };
}

// Fallback initialization
console.warn('\u26A0\uFE0F Using fallback vendor index - no external dependencies found in package.json or source files');

export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency,
  getDependencyInfo,
  libp2pLogger,
  react
};
`}async saveVendorIndex(e,t="browser"){let n=`${t==="node"?"./dist/node":"./dist/browser"}/vendor`,o=`${n}/index.js`;return a.ensureDir(n),a.writeFile(o,e),console.log(`\u{1F4C1} Vendor directory: ${n}`),console.log(`\u{1F4C4} Vendor index saved: ${o}`),console.log(`\u{1F3AF} Platform: ${t}`),console.log(`\u{1F4CF} File size: ${(e.length/1024).toFixed(2)} KB`),o}async saveVendorIndexToDir(e,t,r="browser"){let n=`${t}/vendor`,o=`${n}/index.js`;return a.ensureDir(n),a.writeFile(o,e),console.log(`\u{1F4C1} Vendor directory: ${n}`),console.log(`\u{1F4C4} Vendor index saved: ${o}`),console.log(`\u{1F3AF} Platform: ${r}`),console.log(`\u{1F4CF} File size: ${(e.length/1024).toFixed(2)} KB`),o}async generateAndSave(e,t="browser"){let r=await this.generateVendorIndex(e,t);return{indexPath:await this.saveVendorIndex(r,t),content:r,dependenciesCount:e.size}}};import*as h from"esbuild";import{dirname as z}from"path";var y=class{async build(e){let t=Date.now();try{let r={entryPoints:[e.entryPoint],outfile:e.outfile,bundle:!0,platform:e.platform,format:e.format,minify:e.minify,sourcemap:e.sourcemap,external:e.external?[...e.external]:void 0,target:"es2022",treeShaking:!0,metafile:!0,write:!0,...e.platform==="browser"&&{supported:{"dynamic-import":!0,"import-meta":!0}},...e.platform==="node"&&{banner:{js:`// Built for Node.js ${process.version}\\n// Platform: ${process.platform}-${process.arch}\\n`}},...e.format==="cjs"&&{banner:{js:"// CommonJS Bundle\\n'use strict';\\n"}}};console.log(`\u{1F528} Building ${e.platform} bundle (${e.format})...`),console.log(`   Entry: ${e.entryPoint}`),console.log(`   Output: ${e.outfile}`),console.log(`   Minify: ${e.minify}, Sourcemap: ${e.sourcemap}`);let n=await h.build(r),o=Date.now()-t,s=this.analyzeBuildResult(n,o);return{success:!0,outputPath:e.outfile,stats:s}}catch(r){return console.error("\u274C ESBuild build failed:",r),{success:!1,error:r instanceof Error?r.message:"Unknown build error"}}}analyzeBuildResult(e,t){let r=Object.keys(e.metafile?.inputs||{}),n=Object.keys(e.metafile?.outputs||{}),o=0,s=0;if(e.metafile)for(let i of Object.values(e.metafile.outputs))o+=i.bytes,i.entryPoint&&(s=i.bytes);return{size:o,entryPointSize:s,duration:t,dependencies:r.length,outputFiles:n,inputFiles:r,inputs:r.map(i=>({file:i,size:e.metafile?.inputs?.[i]?.bytes||0})),outputs:n.map(i=>({file:i,size:e.metafile?.outputs?.[i]?.bytes||0}))}}calculateOutputSize(e){return Object.values(e.outputs).reduce((t,r)=>t+r.bytes,0)}async buildBrowserBundle(e){return this.build({...e,platform:"browser",format:"esm"})}async buildNodeBundle(e){return this.build({...e,platform:"node",format:"esm"})}async buildNodeCJS(e){return this.build({...e,platform:"node",format:"cjs"})}async watch(e,t){let r={entryPoints:[e.entryPoint],outfile:e.outfile,bundle:!0,platform:e.platform,format:e.format,minify:e.minify,sourcemap:e.sourcemap,external:e.external?[...e.external]:void 0,target:"es2022",treeShaking:!0,metafile:!0,write:!0};try{let n=await h.context(r);return await n.watch(),console.log(`\u{1F440} Watching for changes: ${e.entryPoint}`),()=>{n.dispose(),console.log("\u{1F6D1} Watch mode stopped")}}catch(n){throw console.error("\u274C Failed to start watch mode:",n),n}}async serve(e,t){let r={entryPoints:[e.entryPoint],outfile:e.outfile,bundle:!0,platform:e.platform,format:e.format,minify:e.minify,sourcemap:e.sourcemap,external:e.external?[...e.external]:void 0,target:"es2022",treeShaking:!0,metafile:!0,write:!0},n={port:t?.port||3e3,servedir:z(e.outfile)};try{let o=await h.context(r),{port:s}=await o.serve(n);return console.log(`\u{1F310} Serving at http://localhost:${s}`),console.log(`   Serving from: ${n.servedir}`),()=>{o.dispose(),console.log("\u{1F6D1} Server stopped")}}catch(o){throw console.error("\u274C Failed to start server:",o),o}}async analyze(e){try{let t={entryPoints:[e.entryPoint],outfile:e.outfile,bundle:!0,platform:e.platform,format:e.format,minify:e.minify,sourcemap:e.sourcemap,external:e.external?[...e.external]:void 0,target:"es2022",treeShaking:!0,write:!1,metafile:!0},r=await h.build(t),n=new Set,o=[];if(r.metafile){for(let[s]of Object.entries(r.metafile.inputs))if(s.includes("node_modules")){let i=s.match(/node_modules\/(@[^\/]+\/[^\/]+|[^\/]+)/);i&&i[1]&&n.add(i[1])}}return r.warnings.length>0&&o.push(...r.warnings.map(s=>s.text)),{dependencies:Array.from(n),sizeEstimate:this.calculateOutputSize(r.metafile),warnings:o}}catch(t){throw console.error("\u274C Bundle analysis failed:",t),t}}};var m=class{constructor(e,t="browser"){this.projectRoot=e;this.platform=t;this.dependencyAnalyzer=new g(e),this.indexGenerator=new f(e),this.builder=new y}dependencyAnalyzer;indexGenerator;builder;async generateVendorBundle(e){console.log(`\u{1F680} Starting ${this.platform} vendor bundle generation...`),console.log(`\u{1F4C1} Project root: ${this.projectRoot}`),console.log(`\u{1F4E6} Output path: ${e}`),console.log(`\u{1F3AF} Platform: ${this.platform}`);let t=Date.now();try{console.log("\u{1F50D} Analyzing dependencies...");let r=await this.dependencyAnalyzer.analyzeDependencies(this.platform);if(r.dependencies.size===0)return console.log("\u26A0\uFE0F No external dependencies found, creating fallback bundle"),this.createFallbackBundle(e,t);console.log(`\u{1F4CA} Found ${r.dependencies.size} external dependencies:`),r.dependencies.forEach((c,p)=>{console.log(`   - ${p}@${c.version}`)}),console.log("\u{1F4DD} Generating vendor index...");let n=await this.indexGenerator.generateVendorIndex(new Map(Array.from(r.dependencies)),this.platform),o=a.dirname(e),s=await this.indexGenerator.saveVendorIndexToDir(n,o,this.platform);console.log(`\u2705 Vendor index created: ${s}`),console.log(`\u{1F528} Building ${this.platform} vendor bundle with esbuild...`);let i=await this.autoDetectExternalDependencies(r),d={entryPoint:s,outfile:e,platform:this.platform,format:"esm",minify:this.platform==="browser",sourcemap:!0,external:i,target:this.platform==="browser"?"es2020":"node18",treeShaking:!0},u=await this.builder.build(d);if(u.success){let c=Date.now()-t;console.log(`\u2705 ${this.platform} vendor bundle successfully created: ${e}`),u.stats&&(console.log("\u{1F4CA} Build statistics:"),console.log(`   Size: ${(u.stats.size/1024/1024).toFixed(2)} MB`),console.log(`   Duration: ${u.stats.duration}ms`),console.log(`   Dependencies processed: ${u.stats.dependencies}`)),console.log(`\u23F1\uFE0F Total generation time: ${c}ms`)}else return console.error(`\u274C ${this.platform} vendor bundle build failed:`,u.error),this.createFallbackBundle(e,t);return u}catch(r){return console.error(`\u{1F4A5} ${this.platform} vendor bundle generation failed:`,r),{success:!1,error:r instanceof Error?r.message:"Unknown error during vendor bundle generation"}}}async autoDetectExternalDependencies(e){let t=[],r=["fs","path","url","child_process","os","crypto","http","https","net","dns","util","stream","buffer","events","module","assert","querystring","zlib","tls","cluster","vm","perf_hooks","readline","repl","timers","string_decoder","worker_threads","@types/node","@types/*"];if(t.push(...r),this.platform==="browser")for(let[n]of e.dependencies)await this.isNodeOnlyPackage(n)&&(console.log(`\u{1F6AB} Excluding Node.js only package from browser: ${n}`),t.push(n));else{let n=["esbuild","typescript","webpack","rollup","vite","jest","mocha","chai","ava","tape","nodemon","pm2","forever","sass","less","stylus","postcss","fs-extra","chokidar"];for(let o of n)e.dependencies.has(o)&&(console.log(`\u{1F6AB} Excluding build tool from Node.js bundle: ${o}`),t.push(o))}return t}async isNodeOnlyPackage(e){try{let t=`${this.projectRoot}/node_modules/${e}/package.json`;if(!a.exists(t))return this.heuristicNodeOnlyCheck(e);let r=a.readJson(t);if(!r||r.browser)return!1;let n=this.getNodeSpecificDependencies(),o={...r.dependencies,...r.peerDependencies};for(let s of Object.keys(o||{}))if(n.some(i=>i.test(s)))return!0;return this.heuristicNodeOnlyCheck(e)}catch{return this.heuristicNodeOnlyCheck(e)}}heuristicNodeOnlyCheck(e){return[/^esbuild/,/^webpack/,/^rollup/,/^vite/,/^parcel/,/^ts-node/,/^tsx/,/^typescript/,/^ts-/,/^@types\//,/^jest/,/^mocha/,/^chai/,/^ava/,/^tape/,/^nodemon/,/^pm2/,/^forever/,/^sass/,/^less/,/^stylus/,/^postcss/,/^fs-extra/,/^chokidar/,/^-cli$/,/^cli-/,/-cli$/,/^express/,/^koa/,/^fastify/,/^socket.io/].some(r=>r.test(e))}getNodeSpecificDependencies(){return[/^fs/,/^path/,/^os/,/^child_process/,/^crypto/,/^http/,/^https/,/^net/,/^dns/,/^url/,/^util/,/^stream/,/^buffer/,/^events/,/^module/,/^assert/,/^querystring/,/^zlib/,/^tls/,/^cluster/,/^vm/,/^perf_hooks/,/^readline/,/^repl/,/^timers/,/^string_decoder/,/^worker_threads/]}async createFallbackBundle(e,t){try{let r=`// Fallback Vendor Bundle - Auto-generated
// Generated: ${new Date().toISOString()}
// No external dependencies found or build failed

// Mock implementations for common browser dependencies
export const libp2pLogger = {
  info: (...args: unknown[]) => console.log('[libp2p]', ...args),
  warn: (...args: unknown[]) => console.warn('[libp2p]', ...args),
  error: (...args: unknown[]) => console.error('[libp2p]', ...args),
  debug: (...args: unknown[]) => console.debug('[libp2p]', ...args),
  trace: (...args: unknown[]) => console.trace('[libp2p]', ...args)
};

export const logger = libp2pLogger;

// Common utilities mock
export const utils = {
  format: (msg: string) => \`[\${new Date().toISOString()}] \${msg}\`,
  createLogger: (name: string) => ({
    info: (...args: unknown[]) => console.log(\`[\${name}]\`, ...args)
  })
};

// Vendor metadata
export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: [],
  totalDependencies: 0,
  isFallback: true
};

console.warn('\u26A0\uFE0F Using fallback vendor bundle - no external dependencies were found or build failed');
console.log('\u2705 Fallback vendor bundle loaded');
`;a.ensureDir(a.dirname(e)),a.writeFile(e,r);let n=Date.now()-t,o={size:Buffer.from(r).length,duration:n,dependencies:0,outputFiles:[e],inputFiles:[]};return console.log(`\u2705 Fallback vendor bundle created: ${e}`),console.log(`\u{1F4CA} Fallback bundle size: ${(o.size/1024).toFixed(2)} KB`),{success:!0,outputPath:e,stats:o}}catch(r){return console.error("\u{1F4A5} Failed to create fallback bundle:",r),{success:!1,error:"Failed to create fallback vendor bundle"}}}async updateHtmlImportMap(e,t){if(console.log(`\u{1F4C4} Updating HTML import map: ${e}`),!a.exists(e))return console.warn(`\u26A0\uFE0F HTML file not found: ${e}`),!1;try{let r=a.readFile(e),n=`    <script type="importmap">
${JSON.stringify(t,null,4)}    </script>`;if(r=r.replace(/<script type="importmap">[^<]*<\/script>/g,""),r.includes('type="importmap"'))return console.log("\u2139\uFE0F Import map already exists in HTML, skipping update"),!0;let o=r.indexOf("</head>");if(o!==-1)r=r.slice(0,o)+`
`+n+`
`+r.slice(o),console.log("\u2705 Import map added to <head> section");else{console.warn("\u26A0\uFE0F No <head> section found, creating one...");let s=r.indexOf("<body>");s!==-1?(r=r.slice(0,s)+`<head>
`+n+`
</head>
`+r.slice(s),console.log("\u2705 Created <head> section with import map")):(r=`<head>
`+n+`
</head>
`+r,console.log("\u2705 Added import map at beginning of file"))}return a.writeFile(e,r),console.log(`\u2705 HTML file successfully updated: ${e}`),!0}catch(r){return console.error("\u274C Failed to update HTML import map:",r),!1}}async generateImportMapOnly(e){console.log(`\u{1F5FA}\uFE0F Generating ${this.platform} import map in: ${e}`);try{a.ensureDir(e);let t=await this.dependencyAnalyzer.analyzeDependencies(this.platform),r=this.platform==="node"?this.generateNodeImportMap(t):this.generateBrowserImportMap(t),n=`${e}/importmap.json`;return a.writeJson(n,r),console.log(`\u2705 ${this.platform} import map created: ${n}`),console.log(`\u{1F4CA} Import map includes ${Object.keys(r.imports).length} dependencies`),Object.keys(r.imports).forEach(o=>{o.includes("/*")||console.log(`   - ${o}`)}),r}catch(t){throw console.error(`\u274C Failed to generate ${this.platform} import map:`,t),new Error(`Import map generation failed: ${t instanceof Error?t.message:"Unknown error"}`)}}generateBrowserImportMap(e){let t={};for(let[r]of e.dependencies)t[r]="./vendor.bundle.mjs",t[`${r}/*`]="./vendor.bundle.mjs";return{imports:t,scopes:{"./":{...t}}}}generateNodeImportMap(e){let t={};for(let[r]of e.dependencies)t[r]="./vendor.mjs",t[`${r}/*`]="./vendor.mjs";return{imports:t,scopes:{"./":{...t}}}}async generateCompleteVendorSetup(e,t){console.log("\u{1F680} Starting complete vendor setup...");let r=await this.generateVendorBundle(e);if(!r.success)return r;if(t&&a.exists(t))try{let n=a.dirname(e),o=await this.generateImportMapOnly(n);await this.updateHtmlImportMap(t,o),console.log("\u2705 Complete vendor setup finished successfully")}catch(n){console.warn("\u26A0\uFE0F Vendor bundle created but HTML update failed:",n)}else t&&console.warn("\u26A0\uFE0F HTML file not found, skipping import map update");return r}async analyzeDependencies(){return console.log("\u{1F50D} Analyzing project dependencies..."),await this.dependencyAnalyzer.analyzeDependencies(this.platform)}getProjectRoot(){return this.projectRoot}getPlatform(){return this.platform}setPlatform(e){this.platform=e}};var b=class{constructor(e=process.cwd()){this.projectRoot=e;this.vendorBundler=new m(e,"browser")}vendorBundler;async run(){let e=process.argv.slice(2),t=e[0]||"",r=this.parsePlatform(e),n=this.parseOutputDir(e,t,r);this.vendorBundler.setPlatform(r);try{switch(t){case"build":let o=this.parseOption(e,"--output")||this.getDefaultOutputPath(r),s=this.parseOption(e,"--html")||"./dist/index.html";await this.build(o,s);break;case"importmap":await this.generateImportMap(n);break;case"analyze":await this.analyze();break;case"clean":await this.clean();break;case"version":this.showVersion();break;case"help":case"--help":case"-h":default:this.showHelp();break}}catch(o){console.error("\u274C CLI Error:",o instanceof Error?o.message:o),process.exit(1)}}parsePlatform(e){if(e.includes("--platform")||e.includes("-p")){let t=e.findIndex(n=>n==="--platform"||n==="-p");return e[t+1]==="node"?"node":"browser"}return"browser"}parseOutputDir(e,t,r){if(t==="importmap"){let n=e.findIndex(s=>s==="--output"||s==="-o");if(n!==-1&&e[n+1])return e[n+1];let o=e[1];return o&&!o.startsWith("-")?o:this.getDefaultImportMapDir(r)}return this.parseOption(e,"--output")||this.getDefaultOutputPath(r)}parseOption(e,t){let r=e.findIndex(n=>n===t);return r!==-1&&e[r+1]?e[r+1]:null}getDefaultOutputPath(e){return e==="node"?"./dist/node/vendor.mjs":"./dist/browser/vendor.bundle.mjs"}getDefaultImportMapDir(e){return e==="node"?"./dist/node":"./dist/browser"}async build(e,t){console.log("\u{1F680} Starting vendor bundle generation..."),console.log(`\u{1F4C1} Project root: ${this.projectRoot}`),console.log(`\u{1F4E6} Output: ${e}`),console.log(`\u{1F3AF} Platform: ${this.vendorBundler.getPlatform()}`);let r=Date.now(),n=await this.vendorBundler.generateVendorBundle(e);if(n.success||(console.error("\u274C Build failed:",n.error),process.exit(1)),a.exists(t)){console.log(`\u{1F4C4} Updating HTML: ${t}`);let s=a.dirname(e),i=await this.vendorBundler.generateImportMapOnly(s);await this.vendorBundler.updateHtmlImportMap(t,i)}else console.log(`\u26A0\uFE0F HTML file not found, skipping importmap update: ${t}`);let o=Date.now()-r;console.log(`\u2705 Vendor bundle generation completed in ${o}ms`),n.stats&&(console.log(`\u{1F4CA} Bundle size: ${(n.stats.size/1024/1024).toFixed(2)} MB`),console.log(`\u{1F4E6} Dependencies: ${n.stats.dependencies}`))}async generateImportMap(e){if(console.log(`\u{1F5FA}\uFE0F Generating ${this.vendorBundler.getPlatform()} import map...`),console.log(`\u{1F4C1} Output directory: ${e}`),e.endsWith(".mjs")||e.endsWith(".js")){let n=a.dirname(e);console.log(`\u26A0\uFE0F  Output path is a file, using directory instead: ${n}`),e=n}a.ensureDir(e);let t=await this.vendorBundler.generateImportMapOnly(e);console.log(`\u2705 Import map generated with ${Object.keys(t.imports).length} entries`),console.log(`\u{1F4C4} Location: ${e}/importmap.json`);let r=Object.entries(t.imports).filter(([n])=>!n.includes("/*")).map(([n,o])=>`   - ${n} \u2192 ${o}`);r.length>0&&(console.log("\u{1F4CB} Import map entries:"),r.forEach(n=>console.log(n)))}async analyze(){console.log("\u{1F50D} Analyzing project dependencies..."),console.log(`\u{1F4C1} Project root: ${this.projectRoot}`),console.log(`\u{1F3AF} Platform: ${this.vendorBundler.getPlatform()}`);let t=await this.vendorBundler.dependencyAnalyzer.analyzeDependencies(this.vendorBundler.getPlatform());console.log(`\u{1F4CA} Found ${t.dependencies.size} external dependencies:`),t.dependencies.size>0?t.dependencies.forEach((r,n)=>{console.log(`   \u{1F4E6} ${n} (${r.version})`)}):console.log("   \u2139\uFE0F No external dependencies found"),console.log(`\u{1F5FA}\uFE0F Import map will contain ${Object.keys(t.importMap.imports).length} entries`)}async clean(){console.log("\u{1F9F9} Cleaning vendor artifacts...");let e=`${this.projectRoot}/vendor`,t=`${this.projectRoot}/dist/vendor.bundle.mjs`,r=`${this.projectRoot}/dist/importmap.json`,n=[e,t,r],o=0;for(let s of n)a.exists(s)&&(a.isDirectory(s)?console.log(`   \u{1F4C1} Would remove directory: ${s}`):console.log(`   \u{1F4C4} Would remove file: ${s}`),o++);console.log(`\u2705 Would clean ${o} vendor artifacts`),console.log("\u26A0\uFE0F Actual file removal not implemented in this version")}showVersion(){let e=`${this.projectRoot}/package.json`;try{let t=a.readJson(e);console.log(`\u{1F4E6} ${t?.name||"@newkind/vendor-scripts"} v${t?.version||"1.0.0"}`),console.log(`\u{1F7E2} Node.js: ${process.version}`),console.log(`\u{1F4BB} Platform: ${process.platform} ${process.arch}`)}catch{console.log("\u{1F4E6} @newkind/vendor-scripts v1.0.0")}}showHelp(){console.log(`
\u{1F680} Vendor Bundle Generator - CLI Tool

Usage:
  vendor-gen <command> [options]

Commands:
  build [options]          - Generate vendor bundle
  importmap [dir]         - Generate only import map (default: ./dist/browser)
  analyze                 - Analyze dependencies without building
  clean                   - Remove generated vendor artifacts
  version                 - Show version information
  help                    - Show this help message

Options:
  -p, --platform <platform>  Target platform: browser (default) or node
  -o, --output <path>        Output path for bundle or directory for importmap
  --html <path>              HTML file to update with import map (build only)

Examples:
  vendor-gen build                                # Browser bundle
  vendor-gen build --platform node               # Node.js bundle
  vendor-gen build -o ./public/vendor.js         # Custom output
  vendor-gen importmap                           # Browser import map
  vendor-gen importmap --platform node           # Node.js import map
  vendor-gen importmap -o ./public               # Custom directory
  vendor-gen analyze                             # Analyze dependencies

Output Structure:
  Browser:
    \u{1F4C1} dist/browser/
      \u251C\u2500\u2500 vendor/
      \u2502   \u2514\u2500\u2500 index.js
      \u251C\u2500\u2500 vendor.bundle.mjs
      \u2514\u2500\u2500 importmap.json
  
  Node.js:
    \u{1F4C1} dist/node/
      \u251C\u2500\u2500 vendor/
      \u2502   \u2514\u2500\u2500 index.js
      \u251C\u2500\u2500 vendor.mjs
      \u2514\u2500\u2500 importmap.json
    `.trim())}};async function O(){let l=new b;process.on("SIGINT",()=>{console.log(`
\u{1F44B} Process interrupted by user`),process.exit(0)}),process.on("SIGTERM",()=>{console.log(`
\u{1F6D1} Process terminated`),process.exit(0)});try{await l.run()}catch(e){console.error("\u{1F4A5} Fatal error:",e instanceof Error?e.message:e),process.exit(1)}}O().catch(console.error);var M="1.0.0",N="Vendor Bundle Generator with Platform Support";function C(l){return new m(l)}function A(l){return new m(l,"node")}function T(l){return new m(l,"browser")}async function k(l,e="./dist/vendor.bundle.mjs",t="browser"){return await new m(l,t).generateVendorBundle(e)}async function _(l,e="./dist/node/vendor.mjs"){return k(l,e,"node")}async function U(l,e="./dist/browser/vendor.bundle.mjs"){return k(l,e,"browser")}async function J(l){return await new g(l).analyzeDependencies()}async function P(l,e="./dist",t="browser"){return await new m(l,t).generateImportMapOnly(e)}async function L(l,e="./dist/node"){return P(l,e,"node")}async function W(l,e="./dist/browser"){return P(l,e,"browser")}var ye={VendorBundler:m,DependencyAnalyzer:g,VendorIndexGenerator:f,ESBuildBuilder:y,FileUtils:a,VendorCLI:b,createVendorBundler:C,createNodeVendorBundler:A,createBrowserVendorBundler:T,generateVendorBundle:k,generateNodeVendorBundle:_,generateBrowserVendorBundle:U,analyzeDependencies:J,generateImportMap:P,generateNodeImportMap:L,generateBrowserImportMap:W,VERSION:M,DESCRIPTION:N};export{N as DESCRIPTION,g as DependencyAnalyzer,y as ESBuildBuilder,a as FileUtils,M as VERSION,m as VendorBundler,b as VendorCLI,f as VendorIndexGenerator,J as analyzeDependencies,T as createBrowserVendorBundler,A as createNodeVendorBundler,C as createVendorBundler,ye as default,W as generateBrowserImportMap,U as generateBrowserVendorBundle,P as generateImportMap,L as generateNodeImportMap,_ as generateNodeVendorBundle,k as generateVendorBundle};
//# sourceMappingURL=vendor.mjs.map
