/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseFactory } from '@twyr/framework-classes';
import { BaseSurface } from 'baseclass:surface';

/**
 * @class Main
 * @extends BaseSurface
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Main Surface for the ServerUser Profile Context.
 */
export class Main extends BaseSurface {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	// #endregion

	// #region Lifecycle Methods
	/**
	 * @memberof Main
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
	 * @memberof Main
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
			httpMethod: 'POST',
			path: '/create',
			handler: this.#createProfile?.bind?.(this)
		});

		baseRoutes?.push?.({
			httpMethod: 'PATCH',
			path: '/update',
			middlewares: [await this?._rbac?.('registered')],
			handler: this.#updateProfile?.bind?.(this)
		});

		baseRoutes?.push?.({
			httpMethod: 'DEL',
			path: '/delete',
			middlewares: [await this?._rbac?.('registered')],
			handler: this.#deleteProfile?.bind?.(this)
		});

		return baseRoutes;
	}

	/**
	 * @memberof Main
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
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #createProfile
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Creates the profile for a new server-user in the system
	 *
	 */
	async #createProfile(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const profileStatus = await apiRegistry?.execute?.('CREATE', {
			data: ctxt.request.body
		});

		ctxt.status = profileStatus?.status;
		ctxt.body = profileStatus?.body;
	}

	/**
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #updateProfile
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Updates the profile for a new server-user in the system
	 * A server-user has to be logged in
	 *
	 */
	async #updateProfile(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const profileUpdateStatus = await apiRegistry?.execute?.('UPDATE', {
			user: ctxt?.state?.user,
			data: ctxt.request.body
		});

		ctxt.status = profileUpdateStatus?.status;
		ctxt.body = profileUpdateStatus?.body;
	}

	/**
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #deleteProfile
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Deletes the profile of a server-user in the system
	 * A server-user has to be logged in
	 *
	 */
	async #deleteProfile(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const userId = ctxt?.state?.user?.id;

		const profileDeleteStatus = await apiRegistry?.execute?.('DELETE', {
			userId: userId
		});

		await ctxt?.logout?.();
		this?.domainInterface?.eventEmitter?.emit?.('SERVER_USER::LOGOUT', {
			userId
		});

		ctxt.status = profileDeleteStatus?.status;
	}
	// #endregion
}

/**
 * @class SurfaceFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The ServerUser Profile Context Contact Surface Class Factory.
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
	 * @returns {Main} - The Main surface instance.
	 *
	 */
	static async createInstances(domainInterface) {
		if (!SurfaceFactory.#mainInstance) {
			const mainInstance = new Main(
				SurfaceFactory['$disk_unc'],
				domainInterface
			);

			await mainInstance?.load?.();
			SurfaceFactory.#mainInstance = mainInstance;
		}

		return SurfaceFactory.#mainInstance;
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
	 * @description Clears the Main instance
	 */
	static async destroyInstances() {
		await SurfaceFactory.#mainInstance?.unload?.();
		SurfaceFactory.#mainInstance = undefined;

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
	 * Returns the name of this surface - Main
	 */
	static get SurfaceName() {
		return 'Main';
	}
	// #endregion

	// #region Private Static Members
	static #mainInstance = undefined;
	// #endregion
}
