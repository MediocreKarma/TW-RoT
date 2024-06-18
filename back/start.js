const { spawn } = require('child_process');
const path = require('path');

// Define paths to your server scripts and their corresponding working directories
const servers = [
    path.resolve(__dirname, './modules/auth'),
    path.resolve(__dirname, './modules/users'),
    path.resolve(__dirname, './modules/chapters'),
    path.resolve(__dirname, './modules/traffic-signs'),
    path.resolve(__dirname, './modules/exercises'),
    path.resolve(__dirname, './web-server'),
];

// Array to hold references to the server processes
const serverProcesses = [];

// Function to start a server process
function startServer(server) {
    const serverProcess = spawn('supervisor', ['index.js'], {
        stdio: 'inherit',
        shell: true,
        cwd: server,
    });

    serverProcess.on('close', (code) => {
        console.log(
            `Server process for ${server.script} exited with code ${code}`
        );
    });

    return serverProcess;
}

// Start each server and store the process reference
servers.forEach((server) => {
    const serverProcess = startServer(server);
    serverProcesses.push(serverProcess);
});

// Handle Ctrl+C (SIGINT)
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down servers...');

    // Kill each server process
    serverProcesses.forEach((serverProcess) => {
        serverProcess.kill('SIGINT');
    });

    // Give some time to ensure all processes are terminated
    setTimeout(() => {
        console.log('All servers have been shut down.');
        process.exit(0);
    }, 1000);
});