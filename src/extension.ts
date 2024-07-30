import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('tategaki.openVerticalEditor', () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'plaintext') {
            vscode.window.showErrorMessage('This extension only works with .txt files');
            return;
        }

        const document = editor.document;
        let currentContent = document.getText();

        const panel = vscode.window.createWebviewPanel(
            'verticalEditor',
            `縦書き: ${document.fileName}`,
            vscode.ViewColumn.Beside,
            { 
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        function updateWebview() {
            panel.webview.html = getWebviewContent(currentContent);
        }

        updateWebview();

        panel.onDidDispose(() => {
            saveContent();
        }, null, context.subscriptions);

        async function saveContent() {
            try {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), currentContent);
                const success = await vscode.workspace.applyEdit(edit);
                if (success) {
                    await document.save();
                    vscode.window.showInformationMessage('Document saved successfully.');
                } else {
                    vscode.window.showErrorMessage('Failed to apply edit.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save document: ${(error as Error).message}`);
            }
        }

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'save':
                    currentContent = convertHtmlToText(message.text);
                    saveContent();
                    break;
                case 'update':
                    currentContent = convertHtmlToText(message.text);
                    break;
            }
        }, undefined, context.subscriptions);
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(text: string): string {
    const lines = text.split('\n').map(line => {
        return `<div class="line">${line}</div>`;
    }).join('');
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>縦書きエディタ</title>
        <style>
            body { 
                font-family: "MS Mincho", "ＭＳ 明朝", serif;
                margin: 0;
                padding: 0;
                height: 100vh;
                overflow: hidden;
            }
            #editor { 
                white-space: pre-wrap; 
                writing-mode: vertical-rl;
                text-orientation: upright;
                height: 100vh;
                width: 100%;
                overflow-x: auto;
                padding: 10px;
                box-sizing: border-box;
                font-size: 16px;
            }
            .line {
                border-right: 1px dotted rgba(170, 170, 170, 0.3);
                padding-right: 5px;
                padding-left: 5px;
                min-width: 1em;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <div id="editor" contenteditable="true" spellcheck="false">${lines}</div>
        <script>
            const vscode = acquireVsCodeApi();
            const editor = document.getElementById('editor');
            let lastContent = editor.innerHTML;

            function updateContent() {
                const content = editor.innerHTML;
                if (content !== lastContent) {
                    lastContent = content;
                    vscode.postMessage({
                        command: 'update',
                        text: content
                    });
                }
            }

            editor.addEventListener('input', updateContent);
            editor.addEventListener('keyup', updateContent);

            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    e.stopPropagation();
                    vscode.postMessage({ command: 'save', text: editor.innerHTML });
                }
            });

            editor.focus();
        </script>
    </body>
    </html>
    `;
}

function convertHtmlToText(html: string): string {
    return html
        .replace(/<div class="line">(.*?)<\/div>/g, '$1\n')
        .replace(/<br\s*\/?>/g, '')  // Remove <br> tags entirely
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n$/, ''); // Remove trailing newline
}