/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseFactory } from '@twyr/framework-classes';
import { createErrorForPropagation } from '@twyr/error-serializer';
import { BaseEventHandler } from 'baseclass:event-handler';

/**
 * @class Session
 * @extends BaseEventHandler
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Event Handler to handle login / logout / register
 */
export class Session extends BaseEventHandler {
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
	 * @name _registerHandlers
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Adds the API to the eventEmitter in the domainInterface
	 *
	 */
	async _registerHandlers() {
		const errors = [];

		try {
			const eventEmitter = this?.domainInterface?.eventEmitter;
			let registerResolutions = [];

			const baseHandlers = await super._registerHandlers?.();
			for (const baseHandler of baseHandlers ?? []) {
				registerResolutions?.push?.(
					eventEmitter?.on?.(baseHandler?.event, baseHandler?.handler)
				);
			}

			registerResolutions?.push?.(
				eventEmitter?.on?.(
					'SERVER_USER::LOGOUT',
					this.#postLogoutCleanup?.bind?.(this)
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
			`${this?.name}::_registerHandler error`,
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
	 * @name _unregisterHandlers
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Removes the API from the eventEmitter in the domainInterface
	 *
	 */
	async _unregisterHandlers() {
		const errors = [];

		try {
			const eventEmitter = this?.domainInterface?.eventEmitter;
			let unregisterResolutions = [];

			unregisterResolutions?.push?.(
				eventEmitter?.off?.(
					'SERVER_USER::LOGOUT',
					this.#postLogoutCleanup?.bind?.(this)
				)
			);

			unregisterResolutions = await Promise?.allSettled?.(
				unregisterResolutions
			);
			for (const unregisterResolution of unregisterResolutions) {
				if (unregisterResolution?.status === 'fulfilled') continue;
				errors?.push?.(unregisterResolution?.reason);
			}

			await super._unregisterHandlers?.();
		} catch (error) {
			errors?.push?.(error);
		}

		if (!errors?.length) return;

		const propagatedError = createErrorForPropagation?.(
			`${this?.name}::_unregisterHandlers error`,
			errors
		);

		if (propagatedError) throw propagatedError;
	}
	// #endregion

	// #region Handlers
	async #postLogoutCleanup(eventData) {
		const cache =
			await this?.domainInterface?.iocContainer?.resolve?.('Cache');
		await cache?.del?.(
			`twyr!entity!value!aggregate!server_user!${eventData?.userId}!basics`
		);

		const logger =
			await this?.domainInterface?.iocContainer?.resolve?.('Logger');
		logger?.debug?.(
			`${this?.name}::postLogoutCleanup: ${eventData?.userId} cache cleared`
		);
	}
	// #endregion
}

/**
 * @class EventHandlerFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The Session Manager Module Session Event Handler Class Factory.
 */
export default class EventHandlerFactory extends EVASBaseFactory {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor() {
		super();
	}
	// #endregion

	// #region Lifecycle API
	/**
	 * @memberof EventHandlerFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name createInstance
	 *
	 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
	 *
	 * @returns {Session} - The Session event handler instance.
	 *
	 */
	static async createInstances(domainInterface) {
		if (!EventHandlerFactory.#eventHandlerInstance) {
			const sessionInstance = new Session(
				EventHandlerFactory['$disk_unc'],
				domainInterface
			);

			await sessionInstance?.load?.();
			EventHandlerFactory.#eventHandlerInstance = sessionInstance;
		}

		return EventHandlerFactory.#eventHandlerInstance;
	}

	/**
	 * @memberof EventHandlerFactory
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
		await EventHandlerFactory.#eventHandlerInstance?.unload?.();
		EventHandlerFactory.#eventHandlerInstance = undefined;

		return;
	}
	// #endregion

	// #region Getters
	/**
	 * @memberof EventHandlerFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name MiddlewareName
	 *
	 * @returns {string} - Name of this event handler.
	 *
	 * @description
	 * Returns the name of this event handler - Session
	 */
	static get EventHandlerName() {
		return 'Session';
	}
	// #endregion

	// #region Private Static Members
	static #eventHandlerInstance = undefined;
	// #endregion
}
