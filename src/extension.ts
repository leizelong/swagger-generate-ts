// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { generateServices } from './commands/gen-services';
import { initDefinitions } from './commands/init-definitions';
import { initProject } from './commands/init-project';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "swagger-generate-ts" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const extensionPath  = context.extensionPath;
	const genServiceCmd = vscode.commands.registerCommand('swagger-generate-ts.gen-services', generateServices(extensionPath));

	const initDefinitionsCmd = vscode.commands.registerCommand('swagger-generate-ts.init-definitions', initDefinitions);

	const initProjectCmd = vscode.commands.registerCommand('swagger-generate-ts.init-project', initProject);

	context.subscriptions.push(genServiceCmd, initDefinitionsCmd, initProjectCmd);
}

// This method is called when your extension is deactivated
export function deactivate() {}
