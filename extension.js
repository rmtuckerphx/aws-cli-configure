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

function showDefaultProfileMapCredentials() {

    const mappedProfile = getDefaultProfileSetTo();
    let message = '';

    switch (mappedProfile) {
        case '<none>':
            message = `No [default] profile in 'credentials'`;
            break;

        case 'default':
            message = `No [named] profile mapped to [default] in 'credentials'`;
            break;
    
        default:
            message = `The [${mappedProfile}] profile is mapped to [default] in 'credentials'`
            break;
    }

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
    const text = getDefaultProfileSetTo();
    if (text) {
        status.text = '$(terminal) AWS CLI: ' + text;
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

async function setDefaultProfileToCredentials() {
    
    const profiles = getSortedProfilesCredentials(false);
    const newProfile = await vscode.window.showQuickPick(profiles, { placeHolder: `Select the [named] profile to set as the [default] profile in the 'credentials' file.` });

    if (newProfile) {
        vscode.window.showInformationMessage(`[default] profile in 'credentials' file set to: '${newProfile}'.`);
    }

    // const target = await vscode.window.showQuickPick(
    //     [
    //         { label: 'User', description: 'User Settings', target: vscode.ConfigurationTarget.Global },
    //         { label: 'Workspace', description: 'Workspace Settings', target: vscode.ConfigurationTarget.Workspace }
    //     ],
    //     { placeHolder: 'Select the view to show when opening a window.' });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.open.credentials', openCredentialsFile));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.open.config', openConfigFile));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.open.both', openBothFiles));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.browse.docs', openOnlineDocs));

    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.default.map.credentials', showDefaultProfileMapCredentials));
    context.subscriptions.push(vscode.commands.registerCommand('aws-cli.set-default-profile.credentials', setDefaultProfileToCredentials));

    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    status.command = 'aws-cli.set-default-profile.credentials';
    status.tooltip = `Set [default] profile in 'credentials' to [named] profile`;
    // status.color = '#000000';
    
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