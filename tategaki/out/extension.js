"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    console.log('Tategaki extension is now active!');
    let disposable = vscode.commands.registerCommand('tategaki.openVerticalEditor', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'plaintext') {
            vscode.window.showErrorMessage('This extension only works with .txt files');
            return;
        }
        const document = editor.document;
        let currentContent = document.getText();
        const panel = vscode.window.createWebviewPanel('verticalEditor', `縦書き: ${document.fileName}`, vscode.ViewColumn.Beside, { enableScripts: true });
        function updateWebview() {
            panel.webview.html = getWebviewContent(currentContent);
        }
        // Initial load of the webview content
        updateWebview();
        // Listen for document saves to update the webview
        const saveSubscription = vscode.workspace.onDidSaveTextDocument(savedDoc => {
            if (savedDoc.uri.toString() === document.uri.toString()) {
                currentContent = document.getText();
                updateWebview();
            }
        });
        panel.onDidDispose(() => {
            saveSubscription.dispose();
            // Automatically save content when closing
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), currentContent);
            vscode.workspace.applyEdit(edit).then(() => {
                document.save();
            });
        });
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'save') {
                currentContent = message.text;
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), currentContent);
                vscode.workspace.applyEdit(edit).then(() => {
                    document.save();
                });
            }
            else if (message.command === 'update') {
                currentContent = message.text;
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getWebviewContent(text) {
    return `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <style>
                body { margin: 0; padding: 0; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
                #editor-container {
                    flex: 1;
                    overflow: auto;
                    display: flex;
                    flex-direction: row-reverse;
                }
                #editor {
                    writing-mode: vertical-rl;
                    text-orientation: upright;
                    white-space: pre-wrap;
                    font-family: 'MS Mincho', serif;
                    font-size: 16px;
                    line-height: 1.5;
                    padding: 10px;
                    box-sizing: border-box;
                }
            </style>
        </head>
        <body>
            <div id="editor-container">
                <div id="editor" contenteditable="true">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const editor = document.getElementById('editor');

                // Listen for Cmd+S or Ctrl+S to save
                document.addEventListener('keydown', (e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                        e.preventDefault(); // Prevent the default save action
                        vscode.postMessage({
                            command: 'save',
                            text: editor.innerText
                        });
                    }
                });

                // Notify the extension when the content is modified
                editor.addEventListener('input', () => {
                    vscode.postMessage({
                        command: 'update',
                        text: editor.innerText
                    });
                });
            </script>
        </body>
        </html>
    `;
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map