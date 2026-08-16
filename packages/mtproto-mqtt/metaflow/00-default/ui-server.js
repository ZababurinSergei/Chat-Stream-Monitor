// ui-server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MetaflowWorkflow } from './metaflow-workflow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/workflow/status', async (req, res) => {
    try {
        const stateFile = path.join(process.cwd(), '.metaflow', 'state.json');
        if (fs.existsSync(stateFile)) {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
            res.json({ success: true, state });
        } else {
            res.json({ success: true, state: null, message: 'Workflow не запущен' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/workflow/run', async (req, res) => {
    try {
        const workflow = new MetaflowWorkflow();
        const result = await workflow.run();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/interface/parse', async (req, res) => {
    try {
        const { parseInterfaceFile } = await import('./interface-parser.js');
        const interfacePath = path.join(process.cwd(), 'INTERFACE.md');
        if (!fs.existsSync(interfacePath)) {
            throw new Error('INTERFACE.md не найден');
        }
        const parsed = parseInterfaceFile(interfacePath);
        res.json({ success: true, data: parsed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/http/parse', async (req, res) => {
    try {
        const { parseHttpFile } = await import('./http-parser.js');
        const httpPath = path.join(process.cwd(), 'request.http');
        if (!fs.existsSync(httpPath)) {
            throw new Error('request.http не найден');
        }
        const requests = parseHttpFile(httpPath);
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/report', async (req, res) => {
    try {
        const reportPath = path.join(process.cwd(), '.metaflow', 'report.json');
        if (fs.existsSync(reportPath)) {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            res.json({ success: true, data: report });
        } else {
            res.json({ success: true, data: null, message: 'Отчет не найден' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Главная страница - отдаем HTML файл
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🌐 UI Server запущен на http://localhost:${PORT}`);
    console.log(`📁 .metaflow директория используется для хранения состояния`);
    console.log(`📄 HTML файл: ${path.join(__dirname, 'public', 'index.html')}`);
});

export default app;
