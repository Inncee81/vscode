/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { generateUuid } from 'vs/base/common/uuid';
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService';
import { BaseExtHostTerminalService, ExtHostTerminal, ITerminalInternalOptions } from 'vs/workbench/api/common/extHostTerminalService';
import { TerminalLocation } from 'vs/workbench/api/common/extHostTypes';
import type * as vscode from 'vscode';

export class ExtHostTerminalService extends BaseExtHostTerminalService {

	constructor(
		@IExtHostRpcService extHostRpc: IExtHostRpcService
	) {
		super(true, extHostRpc);
	}

	public createTerminal(name?: string, shellPath?: string, shellArgs?: string[] | string): vscode.Terminal {
		return this.createTerminalFromOptions({ name, shellPath, shellArgs });
	}

	public createTerminalFromOptions(options: vscode.TerminalOptions, internalOptions?: ITerminalInternalOptions): vscode.Terminal {
		const terminal = new ExtHostTerminal(this._proxy, generateUuid(), options, options.name);
		this._terminals.push(terminal);
		terminal.create(options, this._serializeParentTerminal(options, internalOptions));
		return terminal.value;
	}

	private _serializeParentTerminal(options: vscode.TerminalOptions, internalOptions?: ITerminalInternalOptions): ITerminalInternalOptions {
		internalOptions = internalOptions ? internalOptions : {};
		if (options.location && typeof options.location === 'object' && 'parentTerminal' in options.location) {
			const parentTerminal = options.location.parentTerminal;
			if (parentTerminal) {
				const parentExtHostTerminal = this._terminals.find(t => t.value === parentTerminal);
				if (parentExtHostTerminal) {
					internalOptions.resolvedExtHostIdentifier = parentExtHostTerminal._id;
				}
			}
		} else if (!internalOptions.splitActiveTerminal && options.location === TerminalLocation.Editor || options.location === TerminalLocation.Panel) {
			internalOptions.location = options.location;
		} else if (internalOptions.splitActiveTerminal) {
			internalOptions.location = { splitActiveTerminal: true };
		}
		return internalOptions;
	}
}
