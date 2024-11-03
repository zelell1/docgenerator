import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('docgenerator.generate', () => {
        const panel = vscode.window.createWebviewPanel(
            'formWebview',
            'User Form',
            vscode.ViewColumn.One,
            {
                enableScripts: true 
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            message => {
                const path = getDefaultWorkspacePath();
                switch (message.command) {
                    case 'submit':
                        if (message.path) {
                            vscode.window.showInformationMessage(`Путь к директории: ${message.path}`);
                            GeneratingDocs(message.path);
                        } else {
                            vscode.window.showErrorMessage('Рабочая директория не выбрана и не указана.');
                        }
                        break;
                    case 'getDefaultPath':
                        panel.webview.postMessage({ command: 'setDefaultPath', path});
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Form</title>
        </head>
        <body>
            <form id="userForm">
                <label for="pathInput">Введите путь к директории:</label>
                <input type="text" id="pathInput" name="path" required>
                <br>
                <button type="button" id="defaultPathButton">Директория по умолчанию</button>
                <button type="submit">Отправить</button>
            </form>
            <script>
                const vscode = acquireVsCodeApi();

                document.getElementById('userForm').addEventListener('submit', (event) => {
                    event.preventDefault();
                    const path = document.getElementById('pathInput').value;
                    console.log('Path submitted:', path);
                    vscode.postMessage({ command: 'submit', path });
                });

                document.getElementById('defaultPathButton').addEventListener('click', () => {
                    vscode.postMessage({ command: 'getDefaultPath' });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'setDefaultPath':
                            document.getElementById('pathInput').value = message.path;
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function GeneratingDocs(dir: string): void {
    const command = `cd ${dir} && doxygen -g && doxygen`;
    console.log(dir);
    console.log(command);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
    });

}

function getDefaultWorkspacePath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log(workspaceFolders);
    if (workspaceFolders && workspaceFolders.length > 0) {
        console.log(workspaceFolders[0].uri.path);
        return workspaceFolders[0].uri.path;
    }
    return undefined;
}

export function deactivate() {}
