// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const os = require('os');
const opn = require('opn');
const fs = require('fs');


function openCredentialsFile(previewFlag = true) {

    openFile(path.join(os.homedir(), '.aws', 'credentials'), previewFlag);

}

function openConfigFile(previewFlag = true) {

    openFile(path.join(os.homedir(), '.aws', 'config'), previewFlag);
}

function openBothFiles() {

    openCredentialsFile(false);
    openConfigFile(false);

}

function openFile(filePath, previewFlag) {

    if (fs.existsSync(filePath)) {
        vscode.workspace.openTextDocument(filePath)
            .then(doc => vscode.window.showTextDocument(doc, { preview: previewFlag }))
    }
    else {
        vscode.window.showInformationMessage(`File '${filePath}' does not exist.`);
    }

}

function openOnlineDocs() {

    opn('https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html');

}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('extension.openCredentialsFile', openCredentialsFile));
    context.subscriptions.push(vscode.commands.registerCommand('extension.openConfigFile', openConfigFile));
    context.subscriptions.push(vscode.commands.registerCommand('extension.openBothFiles', openBothFiles));
    context.subscriptions.push(vscode.commands.registerCommand('extension.openOnlineDocs', openOnlineDocs));

};



// this method is called when your extension is deactivated
function deactivate() {
}



exports.activate = activate;
exports.deactivate = deactivate;