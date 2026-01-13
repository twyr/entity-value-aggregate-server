/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseFactory } from '@twyr/framework-classes';
import { createErrorForPropagation } from '@twyr/error-serializer';
import { ServerUserBaseMiddleware } from 'baseclass:middleware';

/**
 * @class Locales
 * @extends ServerUserBaseMiddleware
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Middleware to handle login / logout / register
 */
export class Locales extends ServerUserBaseMiddleware {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	// #endregion

	// #region Protected Methods, to be overridden by derived classes
	/**
	 * @memberof Locales
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _registerApi
	 *
	 * @returns {null} - The array of API to be registered
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
				apiRegistry?.register?.(
					'CREATE_LOCALE',
					this.#createLocales?.bind?.(this)
				)
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.(
					'READ_LOCALE',
					this.#readLocales?.bind?.(this)
				)
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.(
					'UPDATE_LOCALE',
					this.#updateLocales?.bind?.(this)
				)
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.(
					'DELETE_LOCALE',
					this.#deleteLocales?.bind?.(this)
				)
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
	 * @memberof Locales
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
				apiRegistry?.unregister?.(
					'DELETE_LOCALE',
					this.#deleteLocales?.bind?.(this)
				)
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'UPDATE_LOCALE',
					this.#updateLocales?.bind?.(this)
				)
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'READ_LOCALE',
					this.#readLocales?.bind?.(this)
				)
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'CREATE_LOCALE',
					this.#createLocales?.bind?.(this)
				)
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
	async #createLocales({ user, data }) {
		const createData = {
			model: {
				type: 'relational',
				name: 'server-user-locale'
			},

			user: user,
			payload: data,

			relationships: '[serverUser, locale]',
			serializeType: 'server_user_locale',

			eventName: 'SERVER_USER_LOCALE_CREATED'
		};

		const returnValue = await this?._createServerUserEntity?.(createData);
		return returnValue;
	}

	async #readLocales({ user, localeId }) {
		const fetchData = {
			model: {
				type: 'relational',
				name: 'server-user-locale'
			},

			user: user,
			entityId: localeId,

			relationships: '[serverUser, locale]',
			serializeType: 'server_user_locale'
		};

		const returnValue = await this?._readServerUserEntity?.(fetchData);
		return returnValue;
	}

	async #updateLocales({ user, data }) {
		const updateData = {
			model: {
				type: 'relational',
				name: 'server-user-locale'
			},

			user: user,
			payload: data,

			relationships: '[serverUser, locale]',
			serializeType: 'server_user_locale',

			eventName: 'SERVER_USER_LOCALE_UPDATED'
		};

		const returnValue = await this?._updateServerUserEntity?.(updateData);
		return {
			status: returnValue?.status,
			body: returnValue?.body
		};
	}

	async #deleteLocales({ user, localeId }) {
		const deleteData = {
			model: {
				type: 'relational',
				name: 'server-user-locale'
			},

			user: user,
			entityId: localeId,

			eventName: 'SERVER_USER_LOCALE_DELETED'
		};

		const returnValue = await this?._deleteServerUserEntity?.(deleteData);
		return {
			status: returnValue?.status
		};
	}
	// #endregion
}

/**
 * @class MiddlewareFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The ServerUser Domain Profile Locales Middleware Class Factory.
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
	 * @returns {Locales} - The Locales middleware instance.
	 *
	 */
	static async createInstances(domainInterface) {
		if (!MiddlewareFactory.#localeesInstance) {
			const localeesInstance = new Locales(
				MiddlewareFactory['$disk_unc'],
				domainInterface
			);

			await localeesInstance?.load?.();
			MiddlewareFactory.#localeesInstance = localeesInstance;
		}

		return MiddlewareFactory.#localeesInstance;
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
	 * @description Clears the Locales instance
	 */
	static async destroyInstances() {
		await MiddlewareFactory.#localeesInstance?.unload?.();
		MiddlewareFactory.#localeesInstance = undefined;

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
	 * Returns the name of this middleware - Locales
	 */
	static get MiddlewareName() {
		return 'Locales';
	}
	// #endregion

	// #region Private Static Members
	static #localeesInstance = undefined;
	// #endregion
}
