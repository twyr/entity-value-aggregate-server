/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseFactory } from '@twyr/framework-classes';
import { createErrorForPropagation } from '@twyr/error-serializer';
import { BaseMiddleware } from 'baseclass:middleware';

/**
 * @class Session
 * @extends BaseMiddleware
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Middleware to handle login / logout / register
 */
export class Session extends BaseMiddleware {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	// #endregion

	// #region Protected Methods, to be overridden by derived classes
	/**
	 * @memberof Session
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _registerApi
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Adds the API to the apiRegistry in the domainInterface
	 *
	 */
	async _registerApi() {
		const errors = [];

		try {
			const apiRegistry = this?.domainInterface?.apiRegistry;
			let registerResolutions = [];

			const baseApis = await super._registerApi?.();
			for (const baseApi of baseApis ?? []) {
				registerResolutions?.push?.(
					apiRegistry?.register?.(baseApi?.pattern, baseApi?.handler)
				);
			}

			registerResolutions?.push?.(
				apiRegistry?.register?.('LOGIN', this.#login?.bind?.(this))
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.('LOGOUT', this.#logout?.bind?.(this))
			);

			registerResolutions =
				await Promise?.allSettled?.(registerResolutions);
			for (const registerResolution of registerResolutions) {
				if (registerResolution?.status === 'fulfilled') continue;
				errors?.push?.(registerResolution?.reason);
			}
		} catch (error) {
			errors?.push?.(error);
		}

		if (!errors?.length) return;

		const propagatedError = createErrorForPropagation?.(
			`${this?.name}::_registerApi error`,
			errors
		);

		if (propagatedError) throw propagatedError;
	}

	/**
	 * @memberof Session
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _unregisterApi
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Removes the API from the apiRegistry in the domainInterface
	 *
	 */
	async _unregisterApi() {
		const errors = [];

		try {
			const apiRegistry = this?.domainInterface?.apiRegistry;
			let unregisterResolutions = [];

			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.('LOGIN', this.#login?.bind?.(this))
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.('LOGOUT', this.#logout?.bind?.(this))
			);

			unregisterResolutions = await Promise?.allSettled?.(
				unregisterResolutions
			);
			for (const unregisterResolution of unregisterResolutions) {
				if (unregisterResolution?.status === 'fulfilled') continue;
				errors?.push?.(unregisterResolution?.reason);
			}

			await super._unregisterApi?.();
		} catch (error) {
			errors?.push?.(error);
		}

		if (!errors?.length) return;

		const propagatedError = createErrorForPropagation?.(
			`${this?.name}::_unregisterApi error`,
			errors
		);

		if (propagatedError) throw propagatedError;
	}
	// #endregion

	// #region Handlers
	async #login({ tenant, user }) {
		// THIS IS WHERE THE POST-LOGIN PROCESSING, IF ANY REQUIRED
		// GETS EXECUTED

		return {
			status: 200,
			body: `Logged in ${user?.['first_name']} ${user?.['last_name']} for ${tenant?.name} tenant`
		};
	}

	async #logout(ctxt) {
		const cache =
			await this?.domainInterface?.iocContainer?.resolve?.('Cache');

		const userId = ctxt?.state?.user?.id;
		const tenantId = ctxt?.state?.tenant?.id;

		await ctxt?.logout?.();

		await cache?.del?.(
			`twyr!entity!aggregate!server!user!${userId}!basics`
		);
		await cache?.del?.(
			`twyr!entity!aggregate!server!user!${userId}!${tenantId}!permissions`
		);

		return { status: 200, body: 'Logged out' };
	}
	// #endregion
}

/**
 * @class MiddlewareFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The Session Manager Module Session Middleware Class Factory.
 */
export default class MiddlewareFactory extends EVASBaseFactory {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor() {
		super();
	}
	// #endregion

	// #region Lifecycle API
	/**
	 * @memberof MiddlewareFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name createInstance
	 *
	 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
	 *
	 * @returns {Session} - The Session middleware instance.
	 *
	 */
	static async createInstances(domainInterface) {
		if (!MiddlewareFactory.#sessionInstance) {
			const sessionInstance = new Session(
				MiddlewareFactory['$disk_unc'],
				domainInterface
			);

			await sessionInstance?.load?.();
			MiddlewareFactory.#sessionInstance = sessionInstance;
		}

		return MiddlewareFactory.#sessionInstance;
	}

	/**
	 * @memberof MiddlewareFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name destroyInstances
	 *
	 * @returns {undefined} - Nothing.
	 *
	 * @description Clears the Session instance
	 */
	static async destroyInstances() {
		await MiddlewareFactory.#sessionInstance?.unload?.();
		MiddlewareFactory.#sessionInstance = undefined;

		return;
	}
	// #endregion

	// #region Getters
	/**
	 * @memberof MiddlewareFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name MiddlewareName
	 *
	 * @returns {string} - Name of this middleware.
	 *
	 * @description
	 * Returns the name of this middleware - Session
	 */
	static get MiddlewareName() {
		return 'Session';
	}
	// #endregion

	// #region Private Static Members
	static #sessionInstance = undefined;
	// #endregion
}
