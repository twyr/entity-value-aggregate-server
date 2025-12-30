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
 * @classdesc The Main Surface for the Session Manager Module.
 */
export class Main extends BaseSurface {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	//Profile #endregion

	// #region Protected Methods, to be overridden by derived classes
	/**
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _registerSurface
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Adds the route definitions and handlers for this surface to
	 * the Rest API Router
	 *
	 */
	async _registerSurface() {
		const authRepository =
			await this?.domainInterface?.iocContainer?.resolve?.('Auth');
		const baseRoutes = await super._registerSurface?.();

		baseRoutes?.push?.({
			httpMethod: 'POST',
			path: '/login',
			middlewares: [authRepository?.authenticate?.('server-local')],
			handler: this.#login?.bind?.(this)
		});

		baseRoutes?.push?.({
			httpMethod: 'POST',
			path: '/logout',
			middlewares: [await this?._rbac?.('registered')],
			handler: this.#logout?.bind?.(this)
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
	async #login(ctxt) {
		if (!ctxt?.isAuthenticated?.()) return;

		const apiRegistry = this?.domainInterface?.apiRegistry;

		let postLoginProcessor = await apiRegistry?.resolve?.(
			'SESSIONMANAGER::LOGIN'
		);
		if (postLoginProcessor?.length === 1) {
			postLoginProcessor = postLoginProcessor?.shift?.();
		}

		const postLoginStatus = await postLoginProcessor?.({
			tenant: ctxt?.state?.tenant,
			user: ctxt?.state?.user
		});

		ctxt.status = postLoginStatus?.status;
		ctxt.body = postLoginStatus?.body;
	}

	async #logout(ctxt) {
		if (!ctxt.isAuthenticated()) throw new Error(`No active session`);

		const apiRegistry = this?.domainInterface?.apiRegistry;
		let logoutProcessor = await apiRegistry?.resolve?.(
			'SESSIONMANAGER::LOGOUT'
		);
		if (logoutProcessor?.length === 1) {
			logoutProcessor = logoutProcessor?.shift?.();
		}

		const logoutStatus = await logoutProcessor?.(ctxt);

		ctxt.status = logoutStatus?.status;
		ctxt.body = logoutStatus?.body;
	}
	// #endregion
}

/**
 * @class SurfaceFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The Session Manager Module Main Surface Class Factory.
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
