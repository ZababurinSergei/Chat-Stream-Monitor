import express from 'express';
import { readFile, writeFile } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs'
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.join(__dirname, '../');
const PRESETS_FILE = path.join(__dirname, 'presets.json');
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3072"],
        methods: ["GET", "POST"],
        credentials: true
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
    }
});
const port = process.env.PORT || 3072;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// State
let activeApp = 'dynamic-parameter-addition';

// API endpoints
app.get('/api/scripts', async (req, res) => {
    try {
        const packagePath = path.join(PROJECT_DIR, 'package.json');
        const packageJson = JSON.parse(await readFile(packagePath, 'utf-8'));

        res.json({
            status: 'success',
            scripts: packageJson.scripts || {},
            meta: {
                path: packagePath
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to load package.json',
            error: error.message
        });
    }
});

app.get('/api/presets', async (req, res) => {
    try {
        const presets = await readFile(PRESETS_FILE, 'utf-8');
        res.json(JSON.parse(presets));
    } catch (error) {
        res.status(200).json({});
    }
});

app.post('/api/presets', async (req, res) => {
    try {
        const { presetName, presetData } = req.body;

        if (!presetName || !presetData) {
            return res.status(400).json({
                status: 'error',
                message: 'Preset name and data are required'
            });
        }

        let presets = {};
        try {
            const fileContent = await readFile(PRESETS_FILE, 'utf-8');
            presets = JSON.parse(fileContent);
        } catch (err) {
            // Файл не существует - создадим новый
        }

        presets[presetName] = presetData;
        await writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));

        res.json({
            status: 'success',
            message: 'Preset saved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to save preset',
            error: error.message
        });
    }
});

app.delete('/api/presets/:name', async (req, res) => {
    try {
        const presetName = req.params.name;
        let presets = {};

        try {
            const fileContent = await readFile(PRESETS_FILE, 'utf-8');
            presets = JSON.parse(fileContent);
        } catch (err) {
            return res.status(404).json({ error: 'No presets found' });
        }

        if (!presets[presetName]) {
            return res.status(404).json({ error: 'Preset not found' });
        }

        delete presets[presetName];
        await writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));

        res.json({
            status: 'success',
            message: 'Preset deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete preset',
            error: error.message
        });
    }
});

app.get('/api/active-app', (req, res) => {
    res.json({ activeApp });
});

app.post('/api/set-active-app', async (req, res) => {
    const { app: newApp, isNew } = req.body;

    if (!newApp) {
        console.error('[set-active-app] Error: App parameter is required');
        return res.status(400).json({
            status: 'error',
            message: 'App parameter is required'
        });
    }

    console.log(`[set-active-app] Starting migration for app: ${newApp}`);

    try {
        if(isNew) {
            // Для нового пресета просто устанавливаем activeApp
            activeApp = newApp;
            return res.json({
                status: 'success',
                message: 'New app preset created',
                activeApp,
                requiresSave: true
            });
        } else {
            const packagePath = path.join(PROJECT_DIR, 'package.json');
            const packageJson = JSON.parse(await fs.promises.readFile(packagePath, 'utf-8'));

            if (!packageJson.scripts || !packageJson.scripts['migrate:run']) {
                throw new Error(`Script "migrate:run" not found in package.json`);
            }

            // 1. Сначала устанавливаем новое значение
            activeApp = newApp;

            // 2. Затем выполняем команду с УЖЕ обновлённым activeApp
            const command = `npm run migrate:run --preset ${newApp}`;
            console.log(`[set-active-app] Executing: ${command}`);

            const child = exec(command, {
                cwd: PROJECT_DIR,
                shell: true,
                env: {
                    ...process.env,
                    ACTIVE_APP: newApp // Дублируем в env для гарантии
                }
            });

            // Обработка вывода (как в предыдущем примере)
            child.stdout.on('data', (data) => {
                console.log(`[migrate:run] ${data.toString().trim()}`);
            });

            child.stderr.on('data', (data) => {
                console.error(`[migrate:run] ${data.toString().trim()}`);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`[set-active-app] Migration completed successfully`);
                    res.json({
                        status: 'success',
                        message: 'Migration completed',
                        activeApp: newApp // Возвращаем установленное значение
                    });
                } else {
                    console.error(`[set-active-app] Migration failed with code ${code}`);
                    res.status(500).json({
                        status: 'error',
                        message: 'Migration failed',
                        exitCode: code
                    });
                }
            });
        }

    } catch (error) {
        console.error(`[set-active-app] Unexpected error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Socket.IO handlers
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });

    socket.on('run-script', async ({ scriptName, command }, callback) => {
        try {
            if ((!scriptName && !command) || (scriptName && typeof scriptName !== 'string')) {
                throw new Error('Invalid script parameters');
            }

            const actualScriptName = scriptName || command?.replace('npm run ', '');
            const packageJson = JSON.parse(await readFile(path.join(PROJECT_DIR, 'package.json'), 'utf-8'));

            if (!packageJson.scripts || !packageJson.scripts[actualScriptName.trim()]) {
                throw new Error(`Script "${actualScriptName}" not found`);
            }

            console.log(`Running script: ${actualScriptName}`, 'activeApp:', activeApp);
            const child = spawn('npm', ['run', actualScriptName, `--activeApp=${activeApp}`], {
                shell: true,
                cwd: PROJECT_DIR,
                env: {
                    ...process.env,
                    npm_config_activeApp: activeApp
                }
            });

            child.stdout.on('data', (data) => {
                socket.emit('script-stdout', data.toString());
            });

            child.stderr.on('data', (data) => {
                socket.emit('script-stderr', data.toString());
            });

            child.on('close', (code) => {
                socket.emit('script-completed', code);
                callback?.({ code });
            });

        } catch (error) {
            console.error('Script execution error:', error);
            socket.emit('script-error', { error: error.message });
            callback?.({ error: error.message });
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Start server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Project root: ${PROJECT_DIR}`);
});