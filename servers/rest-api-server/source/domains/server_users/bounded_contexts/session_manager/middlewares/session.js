/**
 * Imports for this file
 * @ignore
 */
import { randomInt } from 'node:crypto';
import { DateTime } from 'luxon';

import { EVASBaseFactory } from '@twyr/framework-classes';
import { createErrorForPropagation } from '@twyr/error-serializer';
import { ServerUserBaseMiddleware } from 'baseclass:middleware';

/**
 * @class Session
 * @extends ServerUserBaseMiddleware
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Middleware to handle login / logout / register
 */
export class Session extends ServerUserBaseMiddleware {
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
					'GENERATE_OTP',
					this.#generateOtp?.bind?.(this)
				)
			);
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
			unregisterResolutions?.push?.(
				apiRegistry?.unregister?.(
					'GENERATE_OTP',
					this.#generateOtp?.bind?.(this)
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
	async #generateOtp({ username, userLocale }) {
		// In non-production environments, use a fixed OTP for ease of testing
		let secureOtp = 909090;

		// Step 1: Generate a crypto-secure random 6-digit OTP
		if (global.serverEnvironment === 'production')
			secureOtp = randomInt(100_000, 1_000_000);

		// Step 2: Store the OTP with an expiry against the username
		const cacheRepository =
			await this?.domainInterface?.iocContainer?.resolve?.('Cache');

		const cacheMulti = await cacheRepository?.multi?.();
		cacheMulti?.set?.(`server-user-otp-${username}`, secureOtp);
		cacheMulti?.expire?.(`server-user-otp-${username}`, 600);
		await cacheMulti?.exec?.();

		// Step 3: Compute OTP expiry time and setup the response message
		let expiryTime = DateTime?.now?.()?.plus?.({ minutes: 10 });
		expiryTime = expiryTime
			// TODO: Get the locale based on user preferences
			?.setLocale(userLocale ?? 'en-IN')
			?.toLocaleString?.(DateTime?.TIME_WITH_SHORT_OFFSET)
			?.toLocaleUpperCase?.();

		// Step 4: Prepare the response message
		const i18nRepository =
			await this?.domainInterface?.iocContainer?.resolve?.('MessageI18N');

		const otpMessage = await i18nRepository?.translate(
			'SERVER_USERS::SESSION_MANAGER::OTP_MESSAGE_SMS',
			userLocale,
			{
				otp: secureOtp,
				expiryTime: expiryTime
			}
		);

		const responseMessage = await i18nRepository?.translate(
			'SERVER_USERS::SESSION_MANAGER::OTP_MESSAGE_RESPONSE',
			userLocale
		);

		let responseMsgStruct = {
			type: 'sms',
			username: username,
			otp: secureOtp,
			expiryTime: expiryTime,
			message: otpMessage
		};

		// Step 4: Send the OTP via notification service in production
		if (global.serverEnvironment === 'production') {
			// Send notification to user with the OTP
			const notificationRepository =
				await this?.domainInterface?.iocContainer?.resolve?.(
					'Notification'
				);

			await notificationRepository?.send?.(responseMsgStruct);
		}

		// Finally, send the HTTP Response back
		return {
			status: 200,
			body:
				global.serverEnvironment !== 'production'
					? responseMsgStruct
					: responseMessage
		};
	}

	async #login({ user }) {
		// THIS IS WHERE THE POST-LOGIN PROCESSING, IF ANY REQUIRED,
		// GETS EXECUTED

		// Step 1: Emit event so other parts of the system can start
		// doing what they need to do
		this?.domainInterface?.eventEmitter?.emit?.('SERVER_USER_LOGIN', {
			userId: user?.id
		});

		// Step 2: Use the API Registry to fetch the server-user data from
		// the Profile context
		const apiRegistry = this?.domainInterface?.apiRegistry;
		const loggedInUser = await apiRegistry?.execute?.(
			'SERVERUSERS::PROFILE::READ',
			{
				user: user,
				serverUserId: user?.id
			}
		);

		// Finally: Return the logged in user details
		return {
			status: 200,
			sessionData: {
				id: user?.id,
				role: 'server_user'
			},
			body: loggedInUser
		};
	}

	async #logout({ userId, userRole, userName }) {
		this?.domainInterface?.eventEmitter?.emit?.('SERVER_USER::LOGOUT', {
			userId: userId
		});

		return {
			status: 200,
			body: `Logged out ${userRole}: ${userName}`
		};
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
