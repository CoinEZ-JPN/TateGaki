"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('tategaki.openVerticalEditor', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found');
            return;
        }
        const document = editor.document;
        const fileName = document.fileName;
        // Check if the file is a .txt file
        if (!fileName.endsWith('.txt')) {
            vscode.window.showErrorMessage('TateGaki only works with .txt files.');
            return;
        }
        const text = document.getText();
        const panel = vscode.window.createWebviewPanel('verticalEditor', `TateGaki: ${document.fileName}`, vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = getWebviewContent(text);
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'save':
                    updateOriginalFile(document, message.text);
                    return;
            }
        }, undefined, context.subscriptions);
        // Update webview content when the document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                panel.webview.postMessage({
                    command: 'update',
                    text: e.document.getText()
                });
            }
        });
        panel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }));
}
function getWebviewContent(initialText) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TateGaki Vertical Editor</title>
        <style>
            body {
                padding: 0;
                margin: 0;
            }
            #editor {
                writing-mode: vertical-rl;
                text-orientation: upright;
                height: 100vh;
                width: 100%;
                font-size: 16px;
                line-height: 1.5;
                overflow: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
                padding: 10px;
                box-sizing: border-box;
            }
        </style>
    </head>
    <body>
        <div id="editor" contenteditable="true">${escapeHtml(initialText)}</div>
        <script>
            const vscode = acquireVsCodeApi();
            const editor = document.getElementById('editor');

            let history = [];
            let historyIndex = -1;
            let isComposing = false;

            function saveCursorPosition() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                return {
                    start: getTextNodeOffset(range.startContainer, range.startOffset),
                    end: getTextNodeOffset(range.endContainer, range.endOffset)
                };
            }

            function getTextNodeOffset(node, offset) {
                let totalOffset = 0;
                const treeWalker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
                while (treeWalker.nextNode()) {
                    if (treeWalker.currentNode === node) {
                        return totalOffset + offset;
                    }
                    totalOffset += treeWalker.currentNode.length;
                }
                return totalOffset;
            }

            function restoreCursorPosition(position) {
                const range = document.createRange();
                const start = getNodeAndOffsetFromPosition(position.start);
                const end = getNodeAndOffsetFromPosition(position.end);
                range.setStart(start.node, start.offset);
                range.setEnd(end.node, end.offset);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }

            function getNodeAndOffsetFromPosition(position) {
                let currentOffset = 0;
                const treeWalker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
                while (treeWalker.nextNode()) {
                    const nodeLength = treeWalker.currentNode.length;
                    if (currentOffset + nodeLength >= position) {
                        return {
                            node: treeWalker.currentNode,
                            offset: position - currentOffset
                        };
                    }
                    currentOffset += nodeLength;
                }
                return { node: editor, offset: editor.childNodes.length };
            }

            function saveState() {
                const cursorPosition = saveCursorPosition();
                history = history.slice(0, historyIndex + 1);
                history.push({ text: editor.innerHTML, cursorPosition });
                historyIndex++;
                if (!isComposing) {
                    vscode.postMessage({
                        command: 'save',
                        text: editor.innerText,
                        cursorPosition: cursorPosition
                    });
                }
            }

            function undo() {
                if (historyIndex > 0) {
                    historyIndex--;
                    const state = history[historyIndex];
                    editor.innerHTML = state.text;
                    restoreCursorPosition(state.cursorPosition);
                }
            }

            function redo() {
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    const state = history[historyIndex];
                    editor.innerHTML = state.text;
                    restoreCursorPosition(state.cursorPosition);
                }
            }

            function cut() {
                document.execCommand('cut');
                saveState();
            }

            function copy() {
                document.execCommand('copy');
            }

            function paste() {
                document.execCommand('paste');
                saveState();
            }

            function selectAll() {
                document.execCommand('selectAll');
            }

            editor.addEventListener('compositionstart', () => {
                isComposing = true;
            });

            editor.addEventListener('compositionend', () => {
                isComposing = false;
                saveState();
            });

            editor.addEventListener('input', debounce(() => {
                if (!isComposing) {
                    saveState();
                }
            }, 300)); // Adjust the debounce delay as needed

            editor.addEventListener('keydown', (event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
                    event.preventDefault();
                    undo();
                } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'z') {
                    event.preventDefault();
                    redo();
                } else if ((event.metaKey || event.ctrlKey) && event.key === 'x') {
                    event.preventDefault();
                    cut();
                } else if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
                    event.preventDefault();
                    copy();
                } else if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
                    event.preventDefault();
                    paste();
                } else if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
                    event.preventDefault();
                    selectAll();
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    insertNewLine();
                }
            });

            function insertNewLine() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);
                range.setStartAfter(br);
                range.setEndAfter(br);
                selection.removeAllRanges();
                selection.addRange(range);
                saveState();
            }

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'update') {
                    const cursorPosition = saveCursorPosition();
                    if (editor.innerHTML !== message.text) {
                        editor.innerHTML = message.text;
                    }
                    restoreCursorPosition(cursorPosition);
                }
            });

            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }

            saveState(); // Save the initial state
        </script>
    </body>
    </html>`;
}
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function updateOriginalFile(document, text) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
    vscode.workspace.applyEdit(edit).then(success => {
        if (success) {
            document.save();
        }
        else {
            vscode.window.showErrorMessage('Failed to update the original file');
        }
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map