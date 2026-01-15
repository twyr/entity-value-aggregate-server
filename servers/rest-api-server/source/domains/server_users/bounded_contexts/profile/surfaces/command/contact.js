/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseFactory } from '@twyr/framework-classes';
import { BaseSurface } from 'baseclass:surface';

/**
 * @class Contact
 * @extends BaseSurface
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Contact Surface for the ServerUser Domain Profile.
 */
export class Contact extends BaseSurface {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	// #endregion

	// #region Lifecycle Methods
	/**
	 * @memberof Contact
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name load
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Sets the user role in the request headers for access control purposes
	 * by passing it in to the base class load method
	 *
	 */
	async load() {
		await super.load?.();
	}
	// #endregion

	// #region Protected Methods, to be overridden by derived classes
	/**
	 * @memberof Contact
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _registerSurface
	 *
	 * @returns {null} - The routes to be added to the Rest API Router
	 *
	 * @description
	 * Adds the route definitions and handlers for this surface to
	 * the Rest API Router
	 *
	 */
	async _registerSurface() {
		const baseRoutes = await super._registerSurface?.();

		baseRoutes?.push?.({
			version: 1,
			httpMethod: 'POST',
			path: '/create',
			middlewares: [await this?._rbac?.('registered')],
			handler: this.#createContact?.bind?.(this)
		});

		baseRoutes?.push?.({
			version: 1,
			httpMethod: 'PATCH',
			path: '/update',
			middlewares: [await this?._rbac?.('registered')],
			handler: this.#updateContact?.bind?.(this)
		});

		baseRoutes?.push?.({
			version: 1,
			httpMethod: 'DEL',
			path: '/delete/:contactId',
			middlewares: [await this?._rbac?.('registered')],
			handler: this.#deleteContact?.bind?.(this)
		});

		return baseRoutes;
	}

	/**
	 * @memberof Contact
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _unregisterSurface
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Removes the route definitions and handlers for this surface from
	 * the Rest API Router
	 *
	 */
	async _unregisterSurface() {
		await super._unregisterSurface?.();
		return;
	}
	// #endregion

	// #region Route Handlers
	/**
	 * @memberof Contact
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #createContact
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Creates a new contact for the server-user with the id given
	 *
	 */
	async #createContact(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const contactStatus = await apiRegistry?.execute?.('CREATE_CONTACT', {
			user: ctxt?.state?.user,
			data: ctxt.request.body
		});

		ctxt.status = contactStatus?.status;
		ctxt.body = contactStatus?.body;
	}

	/**
	 * @memberof Contact
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #updateContact
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Updates an existing contact for a server-user in the system
	 * A server-user has to be logged in
	 *
	 */
	async #updateContact(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const contactUpdateStatus = await apiRegistry?.execute?.(
			'UPDATE_CONTACT',
			{
				user: ctxt?.state?.user,
				data: ctxt.request.body
			}
		);

		ctxt.status = contactUpdateStatus?.status;
		ctxt.body = contactUpdateStatus?.body;
	}

	/**
	 * @memberof Contact
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #deleteContact
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Deletes the contact of a server-user in the system
	 * A server-user has to be logged in
	 *
	 */
	async #deleteContact(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const contactDeleteStatus = await apiRegistry?.execute?.(
			'DELETE_CONTACT',
			{
				user: ctxt?.state?.user,
				contactId: ctxt?.params?.contactId
			}
		);

		ctxt.status = contactDeleteStatus?.status;
	}
	// #endregion
}

/**
 * @class SurfaceFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The ServerUser Domain Profile Context Contact Surface Class Factory.
 */
export default class SurfaceFactory extends EVASBaseFactory {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor() {
		super();
	}
	// #endregion

	// #region Lifecycle API
	/**
	 * @memberof SurfaceFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name createInstance
	 *
	 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
	 *
	 * @returns {Contact} - The Contact surface instance.
	 *
	 */
	static async createInstances(domainInterface) {
		if (!SurfaceFactory.#contactInstance) {
			const contactInstance = new Contact(
				SurfaceFactory['$disk_unc'],
				domainInterface
			);

			await contactInstance?.load?.();
			SurfaceFactory.#contactInstance = contactInstance;
		}

		return SurfaceFactory.#contactInstance;
	}

	/**
	 * @memberof SurfaceFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name destroyInstances
	 *
	 * @returns {undefined} - Nothing.
	 *
	 * @description Clears the Contact instance
	 */
	static async destroyInstances() {
		await SurfaceFactory.#contactInstance?.unload?.();
		SurfaceFactory.#contactInstance = undefined;

		return;
	}
	// #endregion

	// #region Getters
	/**
	 * @memberof SurfaceFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name SurfaceName
	 *
	 * @returns {string} - Name of this surface.
	 *
	 * @description
	 * Returns the name of this surface - Contact
	 */
	static get SurfaceName() {
		return 'Contact';
	}
	// #endregion

	// #region Private Static Members
	static #contactInstance = undefined;
	// #endregion
}
