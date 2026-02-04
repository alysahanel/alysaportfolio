const { spawn } = require('child_process');
const path = require('path');

console.log('--- Starting Local Demo Environment ---');

function startProcess(command, args, name, cwd) {
    const proc = spawn(command, args, { cwd, shell: true, stdio: 'pipe' });
    
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

// 1. Start GAMS Server (Port 3001)
startProcess('node', ['server.js'], 'GAMS', path.join(__dirname, 'gams'));

// 2. Start Legal Server (Port 3009)
startProcess('node', ['backend/server.js'], 'LEGAL', path.join(__dirname, 'legal'));

// 3. Start CashTracking Server (Port 5000)
// Ensure python/python3 is available
const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
startProcess(pythonCmd, ['backend/app.py'], 'CASH', path.join(__dirname, 'CashTracking'));

// 4. Start Local Proxy Server (Port 3000)
setTimeout(() => {
    console.log('--- Starting Proxy Server ---');
    startProcess('node', ['local-server.js'], 'PROXY', __dirname);
    console.log('>>> ACCESS LOCAL DEMO AT: http://localhost:3000 <<<');
}, 2000); // Wait a bit for backends to start
