const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('--- Setting up and Starting Local Demo Environment ---');

function installDeps(dir, name) {
    if (fs.existsSync(path.join(dir, 'package.json')) && !fs.existsSync(path.join(dir, 'node_modules'))) {
        console.log(`[${name}] Installing Node dependencies...`);
        try {
            execSync('npm install', { cwd: dir, stdio: 'inherit' });
            console.log(`[${name}] Dependencies installed.`);
        } catch (e) {
            console.error(`[${name}] Failed to install dependencies:`, e.message);
        }
    } else {
         console.log(`[${name}] Dependencies already installed (node_modules exists).`);
    }
}

function installPythonDeps(dir, name) {
    // Basic check to skip if likely installed (not perfect but faster)
    // For now, we'll just log and skip if we assume it's done, or keep it.
    // Let's keep it but make it silent/fast if requirements are satisfied?
    // pip install is usually fast if satisfied.
    if (fs.existsSync(path.join(dir, 'requirements.txt'))) {
        console.log(`[${name}] Installing Python dependencies...`);
        try {
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
            execSync(`${pythonCmd} -m pip install -r requirements.txt`, { cwd: dir, stdio: 'inherit' });
            console.log(`[${name}] Python dependencies installed.`);
        } catch (e) {
            console.error(`[${name}] Failed to install Python dependencies (pip might be missing):`, e.message);
        }
    }
}

function startProcess(command, args, name, cwd, envVars = {}) {
    console.log(`[${name}] Starting server...`);
    const proc = spawn(command, args, { 
        cwd, 
        shell: true, 
        stdio: 'pipe',
        env: { ...process.env, ...envVars }
    });
    
    proc.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => console.log(`[${name}] ${line}`));
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => console.error(`[${name}] ERROR: ${line}`));
    });

    proc.on('close', (code) => {
        console.log(`[${name}] exited with code ${code}`);
    });

    return proc;
}

// 1. Install Dependencies
installDeps(__dirname, 'ROOT');
installDeps(path.join(__dirname, 'gams'), 'GAMS');
installDeps(path.join(__dirname, 'legal', 'backend'), 'LEGAL');
installPythonDeps(path.join(__dirname, 'CashTracking', 'backend'), 'CASH');

// 2. Start Servers
// GAMS (Port 3001)
startProcess('node', ['server.js'], 'GAMS', path.join(__dirname, 'gams'), { PORT: '3001' });

// Legal (Port 3009)
startProcess('node', ['backend/server.js'], 'LEGAL', path.join(__dirname, 'legal'), { PORT: '3009' });

// CashTracking (Port 5000)
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
// Use RENDER=true to force In-Memory DB and Demo User creation (REMOVED to allow persistent local DB)
startProcess(pythonCmd, ['backend/app.py'], 'CASH', path.join(__dirname, 'CashTracking'), { PORT: '5000' });

// Proxy (Port 3000)
setTimeout(() => {
    console.log('--- Starting Proxy Server ---');
    startProcess('node', ['local-server.js'], 'PROXY', __dirname, { PORT: '3000' });
    console.log('>>> ACCESS LOCAL DEMO AT: http://localhost:3000 <<<');
}, 3000);
