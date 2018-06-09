// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const os = require('os');
const opn = require('opn');
const fs = require('fs');
const profileHandler = require('aws-profile-handler');
const hash = require('object-hash');

const DEFAULT_PROFILE = 'default';

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

function listProfilesCredentials() {
    const profiles = getSortedProfilesCredentials(false);

    let message = `Here are the profiles: ${profiles.join(', ')}`;

    vscode.window.showInformationMessage(message);
}

function getSortedProfilesCredentials(includeDefaultProfile = true) {

    const credentialsFile = path.join(os.homedir(), '.aws', 'credentials');
    let result = [];

    if (fs.existsSync(credentialsFile)) {

        // listProfile will check if file is valid. If it's not valid,
        // no need to proceed, just callback the error.
        try {
            // if the credential file is empty, CLI will name the first profile as 'default'
            const profiles = profileHandler.listProfiles();

            if (includeDefaultProfile === false) {
                const index = profiles.indexOf(DEFAULT_PROFILE);

                if (index > -1) {
                    profiles.splice(index, 1);
                }
            }

            result = profiles.sort();

        } catch (error) {
            vscode.window.showWarningMessage(`File '${credentialsFile}' is not valid.`);
            console.log(error);
        }

    }
    else {
        vscode.window.showInformationMessage(`File '${credentialsFile}' does not exist.`);
    }

    return result;
}

function updateStatus(status) {
    let text = getDefaultProfileSetTo();
    if (text) {
        status.text = 'AWS CLI: ' + text;
    }

    if (text) {
        status.show();
    } else {
        status.hide();
    }
}

function getDefaultProfileSetTo() {

    // if there is no default profile or named profile, then show <none>
    let text = '<none>';

    const profiles = getSortedProfilesCredentials();

    const hasDefault = profiles.includes(DEFAULT_PROFILE);

    if (hasDefault) {
        // if there is a default profile, show it 
        text = DEFAULT_PROFILE;
    }

    if (hasDefault && profiles.length > 1) {

        const defaultProfile = profileHandler.getProfileCredentials(DEFAULT_PROFILE);

        if (defaultProfile) {

            profiles.forEach(profile => {

                if (profile !== DEFAULT_PROFILE) {
                    const candidateProfile = profileHandler.getProfileCredentials(profile);

                    if (hash(defaultProfile) === hash(candidateProfile)) {

                        // if there is a named profile that has exactly the same
                        // object keys and values (ie hash) as a named profile, show it
                        text = profile;
                    }
                }
            });

        }


    }


    return text;

}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.open.credentials', openCredentialsFile));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.open.config', openConfigFile));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.open.both', openBothFiles));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.browse.docs', openOnlineDocs));

    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.list-profiles.credentials', listProfilesCredentials));

    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    // status.command = 'extension.selectedLines';
    context.subscriptions.push(status);

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => {
        const credentialsFile = path.join(os.homedir(), '.aws', 'credentials').toLowerCase();

        if (doc.fileName.toLowerCase() === credentialsFile) {
            updateStatus(status);
        }
    }));

    updateStatus(status);

};



// this method is called when your extension is deactivated
function deactivate() {
}



exports.activate = activate;
exports.deactivate = deactivate;