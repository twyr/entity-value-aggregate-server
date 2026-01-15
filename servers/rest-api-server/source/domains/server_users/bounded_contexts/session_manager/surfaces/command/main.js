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
			version: 1,
			httpMethod: 'POST',
			path: '/generate-otp',
			handler: this.#generateOtp?.bind?.(this)
		});

		baseRoutes?.push?.({
			version: 1,
			httpMethod: 'POST',
			path: '/login',
			handler: this.#login?.bind?.(this)
		});

		baseRoutes?.push?.({
			version: 1,
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
	/**
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #generateOtp
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Generates the OTP required for logging into the system
	 * using a mobile number
	 *
	 * @example
	 * // Execute CURL command from the terminal
	 * // Send in the mobile number as "username", and preferred locale as "locale"
	 * // The OTP will be sent to the actual number offline
	 * $ curl -X POST -H "Content-Type: application/json" -d '{"username":"+911234567890", "locale":"en-IN"}' ${base_url}/api/v1/server-users/session-manager/generate-otp
	 *
	 * An OTP has been sent to your registered mobile number.
	 * $
	 *
	 */
	async #generateOtp(ctxt) {
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const otpStatus = await apiRegistry?.execute?.('GENERATE_OTP', {
			username: ctxt?.request?.body?.username,
			userLocale: ctxt?.request?.body?.locale ?? 'en-IN'
		});

		ctxt.status = otpStatus?.status;
		ctxt.body = otpStatus?.body;
	}

	/**
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #login
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Logs the user in, creates a session, and sends a cookie back
	 * if the otp matches the one generated in the previous call
	 *
	 * @example
	 * // Execute CURL command from the terminal
	 * // Send in the mobile number as "username" and the generated OTP as "password"
	 * $ curl -X POST -H "Content-Type: application/json" -d '{"username":"+911234567890", "password":"127024"}' -c ./cookies.txt ${base_url}/server-users/session-manager/login
	 *
	 * ServerUser basic profile
	 * $
	 *
	 */
	async #login(ctxt) {
		const i18nRepository =
			await this?.domainInterface?.iocContainer?.resolve?.('MessageI18N');

		const userLocale = ctxt?.state?.user?.locales?.filter?.(
			(locale) => !!locale?.primary
		)?.[0]?.locale;

		// Sanity check...
		if (ctxt?.isAuthenticated?.()) {
			const errorMessage = await i18nRepository?.translate(
				'SERVER_USERS::SESSION_MANAGER::EXISTING_ACTIVE_SESSION',
				userLocale
			);

			throw new Error(errorMessage);
		}

		// Step 1: Login...
		const authRepository =
			await this?.domainInterface?.iocContainer?.resolve?.('Auth');
		const authenticator =
			authRepository?.authenticate?.('server-user-local');

		await authenticator?.(ctxt, async () => {});

		// Step 2: Post Login Processing...
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const postLoginStatus = await apiRegistry?.execute?.('LOGIN', {
			user: ctxt?.state?.user,
			role: ctxt?.session?.passport?.user?.['role']
		});

		ctxt.session.passport.user = postLoginStatus?.sessionData;
		ctxt.status = postLoginStatus?.status;
		ctxt.body = postLoginStatus?.body;
	}

	/**
	 * @memberof Main
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name #logout
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Logs the user out
	 *
	 * @example
	 * // Execute CURL command from the terminal
	 * $ curl -X POST -b ./cookies.txt ${base_url}/api/v1/server_users/session-manager/logout
	 *
	 * Logged out server-user: ${First Name} ${Last Name}
	 * $
	 *
	 */
	async #logout(ctxt) {
		const userId = ctxt?.state?.user?.id;
		const userRole = ctxt?.session?.passport?.user?.['role'];
		const userName = `${ctxt?.state?.user?.['first_name']} ${ctxt?.state?.user?.['last_name']}`;

		await ctxt?.logout?.();

		const apiRegistry = this?.domainInterface?.apiRegistry;
		const logoutStatus = await apiRegistry?.execute?.('LOGOUT', {
			userId: userId,
			userRole: userRole,
			userName: userName
		});

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
