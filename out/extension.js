"use strict";var u=Object.create;var r=Object.defineProperty;var w=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var m=Object.getPrototypeOf,h=Object.prototype.hasOwnProperty;var f=(e,n)=>{for(var i in n)r(e,i,{get:n[i],enumerable:!0})},l=(e,n,i,s)=>{if(n&&typeof n=="object"||typeof n=="function")for(let o of g(n))!h.call(e,o)&&o!==i&&r(e,o,{get:()=>n[o],enumerable:!(s=w(n,o))||s.enumerable});return e};var b=(e,n,i)=>(i=e!=null?u(m(e)):{},l(n||!e||!e.__esModule?r(i,"default",{value:e,enumerable:!0}):i,e)),x=e=>l(r({},"__esModule",{value:!0}),e);var E={};f(E,{activate:()=>y});module.exports=x(E);var t=b(require("vscode"));function y(e){let n=t.commands.registerCommand("tategaki.openVerticalEditor",()=>{let i=t.window.activeTextEditor;if(!i||i.document.languageId!=="plaintext"){t.window.showErrorMessage("This extension only works with .txt files");return}let s=i.document,o=s.getText(),a=t.window.createWebviewPanel("verticalEditor",`\u7E26\u66F8\u304D: ${s.fileName}`,t.ViewColumn.Beside,{enableScripts:!0,retainContextWhenHidden:!0});function v(){a.webview.html=C(o)}v(),a.onDidDispose(()=>{c()},null,e.subscriptions);async function c(){try{let d=new t.WorkspaceEdit;d.replace(s.uri,new t.Range(0,0,s.lineCount,0),o),await t.workspace.applyEdit(d)?(await s.save(),t.window.showInformationMessage("Document saved successfully.")):t.window.showErrorMessage("Failed to apply edit.")}catch(d){t.window.showErrorMessage(`Failed to save document: ${d.message}`)}}a.webview.onDidReceiveMessage(d=>{switch(d.command){case"save":o=p(d.text),c();break;case"update":o=p(d.text);break}},void 0,e.subscriptions)});e.subscriptions.push(n)}function C(e){return`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\u7E26\u66F8\u304D\u30A8\u30C7\u30A3\u30BF</title>
        <style>
            body { 
                font-family: "MS Mincho", "\uFF2D\uFF33 \u660E\u671D", serif;
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
        <div id="editor" contenteditable="true" spellcheck="false">${e.split(`
`).map(i=>`<div class="line">${i}</div>`).join("")}</div>
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
    `}function p(e){return e.replace(/<div class="line">(.*?)<\/div>/g,`$1
`).replace(/<br\s*\/?>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\n$/,"")}0&&(module.exports={activate});
