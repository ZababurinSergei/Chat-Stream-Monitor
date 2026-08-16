import path from 'path';
import process from 'process';
import nodemailer from 'nodemailer';
import cors from 'cors';
import Enqueue from 'express-enqueue';
import compression from 'compression';
import proxy from 'express-http-proxy';
import * as dotenv from 'dotenv';
import JiraApi from 'jira-client';
import express from 'express';
import { env } from './env.node.mjs'

let __dirname = process.cwd();
dotenv.config();
export const modules = async (app) => {
    let whitelist = []

    const transporter = nodemailer.createTransport({
        host: 'mail.digitalms.ru',
        port: 587,
        secure: false,
        auth: {
            // TODO: replace `user` and `pass` values from <https://forwardemail.net>
            user: 'techmailhr',
            pass: '%hbHhsxk3e8auM7y'
        }
    });

// const aggregatorRegistry = new AggregatorRegistry();
// register for prometheus aggregation
// app.get('/metrics', async (_, res) => {
//     const metrics = await getAggregateMetrics();
//     res.set('Content-Type', aggregatorRegistry.contentType);
//     res.send(metrics.metrics());
// });
// metrics for graphql requests
// const apolloMetricsPlugin = createMetricsPlugin(register);
// metrics for rest requests
// app.use(
//     promBundle({
//         autoregister: false, // disable /metrics for single workers
//         includeMethod: true,
//         includeStatusCode: true,
//         includePath: true,
//         promRegistry: register,
//     }),
// );

    app.use(compression());
    app.use(express.json());

    const jira = new JiraApi({
        protocol: process.env.JIRA_protocol,
        host: process.env.JIRA_host,
        username: process.env.JIRA_username,
        password: process.env.JIRA_password,
        apiVersion: process.env.JIRA_apiVersion,
        strictSSL: process.env.JIRA_strictSSL
    });

    const queue = new Enqueue({
        concurrentWorkers: 4,
        maxSize: 200,
        timeout: 30000
    });

    console.log('__dirname', __dirname);

    app.use(await cors({ credentials: true }));
    app.use(queue.getMiddleware());

    app.use((req, res, next) => {
        console.log(`node: 'icd-11': ${req.method}: ${req.path}`);
        next();
    });

    // app.set('view cache', false);
    // app.use((req, res, next) => {
        // res.set('Cache-Control', 'no-store')
        // next()
    // })

    app.get(`/welcomebook`, (req, res, next) => {
        next();
    });

    app.get(`/rules`, (req, res, next) => {
        next();
    });

    app.get(`/checklist`, (req, res, next) => {
        next();
    });

    app.get(`/daap`, (req, res, next) => {
        next();
    });

    app.get(`/wallet`, (req, res, next) => {
        next();
    });

    app.get(`/mss`, (req, res, next) => {
        next();
    });

    let corsOptions = {
        origin: function (origin, callback) {
            console.log('origin', origin);
            if (whitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    };

    app.post(`/smtp_client`, async (req, res) => {
        try {
            // console.log('@@@@@@@@@@@@@@@@@@2', req.body)
            console.log('SEND EMAIL', {
                from: '"Welcome Book feedback" <welcomebook@digitalms.ru>',
                to: 'hr@digitalms.ru',
                subject: 'Welcome Book feedback',
                html: `<b>${req.body.mail.message}</b>`
            });

            const info = await transporter.sendMail({
                from: '"Welcome Book feedback" <welcomebook@digitalms.ru>',
                to: 'zababurins@vk.com',
                subject: 'Welcome Book feedback',
                html: `<b>${req.body.mail.message}</b>`
            });

            console.log('RESPONSE FROM SMTP HOST', info);
            res.status(200).send({
                status: true,
                message: info
            });
        } catch (e) {
            res.send({
                status: false,
                message: ''
            });
        }
    });

    // app.use(proxy('localhost:8080', {
    //     limit: '5mb',
    //     filter: function (req) {
    //         const data = ['/code/'].some(path => req.path.includes(path));
    //         return data;
    //     }
    // }));

    app.use('/checklist', express.static(`${__dirname}/services/checklist/src`));
    app.use('/json-ld', express.static(`${__dirname}/services/json-ld`));
    app.use('/rules', express.static(`${__dirname}/services/rules/src`));
    app.use('/dapp', express.static(`${__dirname}/services/dapp/src`));
    app.use('/wallet', express.static(`${__dirname}/services/wallet/src`));
    app.use('/mss', express.static(`${__dirname}/services/mss/src`));
    app.use('/welcomebook', express.static(`${__dirname}/services/welcomebook/src`));
    app.use('/mkb', express.static(`${__dirname}/services/mkb/src`));
    app.use( express.static(`${__dirname}/services/mkb/build`));
    app.use('/blockchain', express.static(`${__dirname}/services/blockchain/src`));
    app.use('/newkind', express.static(`${__dirname}/services/newkind/src`));
    app.use('/elite', express.static(`${__dirname}/services/elite/src`));
    app.use('/terminal', express.static(`${__dirname}/services/terminal/src`, {
        setHeaders: function (res, path, stat) {
            res.set('Cross-Origin-Embedder-Policy', 'require-corp');
            res.set('Cross-Origin-Opener-Policy', 'same-origin');
        }
    }));
    app.use('/database', express.static(`${__dirname}/services/database/build`));
    // app.use('/terminal', express.static(`${__dirname}/services/terminal/src`));
    app.use('/docs', express.static(`${__dirname}/services/docs/docs`));

    app.use('/template', express.static(`${__dirname}/template`));
    app.use(express.static(`${__dirname}/docs`));
    app.use('/services', express.static(`${__dirname}/services`));

    app.use('/modules', express.static(`${__dirname}/services/database/build/modules`));

    // app.get(`/welcomebook/*`, async (req, res) => {
    //     res.status(200).sendFile(path.join(__dirname, '/services/welcomebook/examples/v2.29.2.html'));
    // })
    // app.use(express.static(`${__dirname}/services/welcomebook/src`));

    app.post(`/mail`, async (req, res) => {
        console.log('index ----- index', req.body.mail.message);
        const info = await transporter.sendMail({
            from: '"Welcome Book feedback"',
            to: 'hr@digitalms.ru',
            subject: 'Welcome Book feedback',
            html: `<b>${req.body.mail.message}</b>`
        });

        res.status(200).send({
            status: true,
            message: info
        });
    });

    app.get(`/env.json`, async (req, res) => {
        res.status(200).sendFile(path.join(__dirname, 'env.json'))
    })

    app.get(`/env.mjs`, async (req, res) => {
        res.status(200).sendFile(path.join(__dirname, 'env.mjs'))
    })

    const dapp = env().DAPP

    console.log('DAPP: ', dapp)

    app.use(proxy('https://metamart-dev.helpms.ru', {
        limit: '5mb',
        filter: function (req) {
            const data = ['/metamart-subscription-service/'].some(path => req.path.startsWith(path));
            return data;
        }
    }));

    app.use(proxy('http://svc-fer-dev.helpms.ru:3333', {
        limit: '5mb',
        filter: function (req) {
            const data = ['/v1/'].some(path => req.path.startsWith(path));
            return dapp === 'rules' ? data : false;
        }
    }));

    app.use(proxy('https://mkb11-compose-dev.digitalms.ru', {
        limit: '5mb',
        filter: function(req) {
            const data = ['/v1/'].some(path => req.path.includes(path))
            return dapp === 'mkb' ? data : false;
        }
    }));

    //https://jira-node.github.io/class/src/jira.js~JiraApi.html
    //https://jira-node.github.io/file/src/jira.js.html#lineNumber22
    app.post(`/project`, async (req, res) => {
        try {
            const project = await jira.getProject('MKB11');
            // const issue = await jira.findIssue(10);
            // console.log(`Status: ${issue.fields.status.name}`);
            console.log('========= JIRA =========', project);
            res.status(200).send(project);
        } catch (err) {
            console.error(err);
            res.status(400).send(err);
        }
    });

    app.get(`/*`, async (req, res) => {
        // console.log('index ----- index', __dirname)
        res.status(200).sendFile(path.join(__dirname, '/docs/index.html'));
    });

    app.post(`/auth`, async (req, res) => {
        console.log('==== AUTH POST ====', req.path, req.body);
    });

    app.post(`/*`, async (req, res) => {
        console.log('==== POST ====', req.path);
    });

    app.use(queue.getErrorMiddleware());

    return app
}

export default {
    description: 'server welcomebook'
};