/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseFactory } from '@twyr/framework-classes';
import { createErrorForPropagation } from '@twyr/error-serializer';
import { ServerUserBaseMiddleware } from 'baseclass:middleware';

/**
 * @class Contacts
 * @extends ServerUserBaseMiddleware
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Middleware to handle login / logout / register
 */
export class Contacts extends ServerUserBaseMiddleware {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	// #endregion

	// #region Protected Methods, to be overridden by derived classes
	/**
	 * @memberof Contacts
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
					'CREATE_CONTACT',
					this.#createContacts?.bind?.(this)
				)
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.(
					'READ_CONTACT',
					this.#readContacts?.bind?.(this)
				)
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.(
					'UPDATE_CONTACT',
					this.#updateContacts?.bind?.(this)
				)
			);
			registerResolutions?.push?.(
				apiRegistry?.register?.(
					'DELETE_CONTACT',
					this.#deleteContacts?.bind?.(this)
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
	 * @memberof Contacts
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
					'DELETE_CONTACT',
					this.#deleteContacts?.bind?.(this)
				)
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'UPDATE_CONTACT',
					this.#updateContacts?.bind?.(this)
				)
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'READ_CONTACT',
					this.#readContacts?.bind?.(this)
				)
			);
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'CREATE_CONTACT',
					this.#createContacts?.bind?.(this)
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
	async #createContacts({ user, data }) {
		const createData = {
			model: {
				type: 'relational',
				name: 'server-user-contact'
			},
			user: user,
			payload: data,

			relationships: '[serverUser, contactType]',
			serializeType: 'server_user_contact',

			eventName: 'SERVER_USER_CONTACT_CREATED'
		};

		const returnValue = await this?._createServerUserEntity?.(createData);
		return returnValue;
	}

	async #readContacts({ user, contactId }) {
		const fetchData = {
			model: {
				type: 'relational',
				name: 'server-user-contact'
			},
			user: user,
			entityId: contactId,

			relationships: '[serverUser, contactType]',
			serializeType: 'server_user_contact'
		};

		const returnValue = await this?._readServerUserEntity?.(fetchData);
		return returnValue;
	}

	async #updateContacts({ user, data }) {
		const updateData = {
			model: {
				type: 'relational',
				name: 'server-user-contact'
			},

			user: user,
			payload: data,

			relationships: '[serverUser, contactType]',
			eventName: 'SERVER_USER_CONTACT_UPDATED'
		};

		const returnValue = await this?._updateServerUserEntity?.(updateData);
		return {
			status: returnValue?.status,
			body: returnValue?.body
		};
	}

	async #deleteContacts({ user, contactId }) {
		const deleteData = {
			model: {
				type: 'relational',
				name: 'server-user-contact'
			},

			user: user,
			entityId: contactId,

			eventName: 'SERVER_USER_CONTACT_DELETED'
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
 * @classdesc The ServerUser Domain Profile Contacts Middleware Class Factory.
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
	 * @returns {Contacts} - The Contacts middleware instance.
	 *
	 */
	static async createInstances(domainInterface) {
		if (!MiddlewareFactory.#contactsInstance) {
			const contactsInstance = new Contacts(
				MiddlewareFactory['$disk_unc'],
				domainInterface
			);

			await contactsInstance?.load?.();
			MiddlewareFactory.#contactsInstance = contactsInstance;
		}

		return MiddlewareFactory.#contactsInstance;
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
	 * @description Clears the Contacts instance
	 */
	static async destroyInstances() {
		await MiddlewareFactory.#contactsInstance?.unload?.();
		MiddlewareFactory.#contactsInstance = undefined;

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
	 * Returns the name of this middleware - Contacts
	 */
	static get MiddlewareName() {
		return 'Contacts';
	}
	// #endregion

	// #region Private Static Members
	static #contactsInstance = undefined;
	// #endregion
}
