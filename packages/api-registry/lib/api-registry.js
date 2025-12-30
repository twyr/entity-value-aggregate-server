/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseClass } from '@twyr/framework-classes';

/**
 * @class APIRegistry
 * @extends EVASBaseClass
 *
 * @param {string} [domainName] - The name of the domain that hosts this APIRegistry
 * @param {object} [parentRegistry] - The parent domain's APIRegistry
 *
 * @classdesc
 * The API Registry. Middlewares across the board
 * can register with their local API Registry and
 * expose their functionality to the rest of the
 * Server.
 */
export class APIRegistry extends EVASBaseClass {
	// #region Constructor
	//eslint-disable-next-line jsdoc/require-jsdoc
	constructor(domainName, parentRegistry) {
		super();

		this.#scopeName = domainName?.toLocaleUpperCase?.();
		this.#parentRegistry = parentRegistry;

		this.#parentRegistry?.registerChild?.(this.#scopeName, this);
	}
	// #endregion

	// #region Interface API
	/**
	 * @memberof APIRegistry
	 * @async
	 * @instance
	 * @function
	 * @name registerChild
	 *
	 * @param {string} name - The name of child domain.
	 * @param {APIRegistry} apiRegistry - The child domain's API registry.
	 *
	 * @returns {null} Nothing.
	 *
	 * @description
	 * Registers a child domain's API Registry.
	 */
	async registerChild(name, apiRegistry) {
		name = name?.toLocaleUpperCase?.();
		if (this.#childRegistries?.get?.(name))
			throw new Error(
				`Child registry with ${name} is already registered`
			);

		this.#childRegistries?.add?.(name, apiRegistry);
	}

	/**
	 * @memberof APIRegistry
	 * @async
	 * @instance
	 * @function
	 * @name register
	 *
	 * @param {string} pattern - The pattern to which this api will respond.
	 * @param {Function} api - The api to be invoked against the pattern.
	 *
	 * @returns {boolean} Boolean true/false - depending on whether the
	 * registration succeeded.
	 *
	 * @description
	 * Registers the api function as a handler for the pattern.
	 */
	async register(pattern, api) {
		if (typeof api !== 'function') {
			throw new Error(
				`${this?.domainPath}::${this?.name}::register expects a function for the pattern: ${pattern}`
			);
		}

		pattern = pattern?.toLocaleUpperCase?.();
		if (!this.#apiMap?.has?.(pattern)) this.#apiMap?.set?.(pattern, []);

		const apiList = this.#apiMap?.get?.(pattern);
		if (!apiList?.find?.(api)) apiList?.push?.(api);

		if (serverEnvironment === 'production') return true;
		console?.info?.(
			`${this?.name}::register: ${this?.domainPath}::${pattern}`
		);

		return true;
	}

	/**
	 * @memberof APIRegistry
	 * @async
	 * @instance
	 * @function
	 * @name resolve
	 *
	 * @param {string} pattern - The pattern to be executed.
	 *
	 * @returns {Array} The results of the execution.
	 *
	 * @description
	 * Resolves the pattern asked for, and returns all the API
	 * handlers that can respond to it - across the entire server
	 * codebase
	 */
	async resolve(pattern) {
		const patternLocal = pattern?.toLocaleUpperCase?.()?.split?.('::');

		// Step 1: Check if we can resolve it locally...
		let apis = await this?._find?.(patternLocal);
		if (apis?.length > 0) return [...apis];
		if (!this.#parentRegistry) return [...apis];

		// Step 2: Ask the parent to resolve it...
		apis = await this.#parentRegistry?.resolve?.(pattern);
		return apis;
	}

	/**
	 * @memberof APIRegistry
	 * @async
	 * @instance
	 * @function
	 * @name unregister
	 *
	 * @param {string} pattern - The pattern to which this api will respond.
	 * @param {Function} api - The api to be de-registered against the pattern.
	 *
	 * @returns {boolean} Boolean true/false - depending on whether the
	 * de-registration succeeded.
	 *
	 * @description
	 * De-registers the api function as a handler for the pattern.
	 */
	async unregister(pattern, api) {
		if (typeof api !== 'function') {
			throw new Error(
				`${this?.domainPath}::${this?.name}::unregister expects a function for the pattern: ${pattern}`
			);
		}

		pattern = pattern?.toLocaleUpperCase?.();
		if (!this.#apiMap?.has?.(pattern)) return true;

		const apiList = this.#apiMap?.get?.(pattern);

		const apiIndex = apiList?.indexOf?.(api);
		if (apiIndex < 0) return true;

		apiList?.splice?.(apiIndex, 1);
		if (apiList?.length <= 0) this.#apiMap?.delete?.(pattern);

		if (serverEnvironment === 'production') return true;
		console?.info?.(
			`${this?.domainPath}::${this?.name}::unregister: ${pattern} API`
		);

		return true;
	}

	/**
	 * @memberof APIRegistry
	 * @async
	 * @instance
	 * @function
	 * @name unregisterAll
	 *
	 * @returns {null} Nothing.
	 *
	 * @description
	 * De-registers everything, including children.
	 */
	async unregisterAll() {
		if (serverEnvironment !== 'production')
			console?.info?.(
				`\n${this?.domainPath}::${this?.name}::unregisterAll`
			);

		this.#apiMap?.clear?.();
		this.#childRegistries?.clear?.();

		this.#parentRegistry = undefined;
		return true;
	}
	// #endregion

	// #region "Protected Methods"
	/**
	 * @memberof APIRegistry
	 * @async
	 * @instance
	 * @function
	 * @name _find
	 *
	 * @param {string} pattern - The pattern to be executed.
	 *
	 * @returns {Array} The apis that match the pattern.
	 *
	 * @description
	 * Searches for the pattern in this registry and downwards,
	 * and returns the apis registered against it.
	 *
	 * TREAT THIS AN INTERNAL METHOD ONLY. CALL IT DIRECTLY AT YOUR OWN RISK.
	 *
	 */
	async _find(pattern) {
		const patternScope = pattern?.shift?.();

		// Step 1: Check if the pattern array's first element is the scope name...
		if (patternScope === this.#scopeName) {
			const apiPattern = pattern?.join?.('::');
			const registeredApis = this.#apiMap?.get?.(apiPattern) ?? [];
			return registeredApis;
		}

		// Step 2: See if we one of the children has the next scope name...
		const childRegistry = this.#childRegistries?.get?.(pattern?.[0]);
		if (childRegistry) {
			const registeredApis = await childRegistry?._find?.(pattern);
			return registeredApis;
		}

		// Step 3: No match found...
		return [];
	}
	// #endregion

	// #region Getters / Setters
	/**
	 * @memberof APIRegistry
	 * @instance
	 * @readonly
	 * @member {string} name
	 * @returns {string} Path of this instance, starting from the server down through the domain chain.
	 */
	get domainPath() {
		if (this.#parentRegistry) {
			return `${this.#parentRegistry?.domainPath ?? ''}::${this.#scopeName ?? ''}`;
		} else {
			return this.#scopeName ?? '';
		}
	}
	// #endregion

	// #region Private Fields
	#scopeName = undefined;
	#parentRegistry = undefined;

	#apiMap = new Map();
	#childRegistries = new Map();
	// #endregion
}
