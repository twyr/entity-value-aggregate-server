/**
 * Imports for this file
 * @ignore
 */
import { EVASBaseRepository } from '@twyr/framework-classes';
import { EVASBaseFactory } from '@twyr/framework-classes';

/**
 * @class Notification
 * @extends EVASBaseRepository
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [iocContainer] - IoC module providing DI repositories
 * @param {object} [configuration] - requested repository configuration
 *
 * @classdesc The Notification Repository Class.
 *
 */
class Notification extends EVASBaseRepository {
	// #region Constructor
	constructor(location, iocContainer, configuration) {
		super(location, iocContainer, configuration);
	}
	// #endregion

	// #region Lifecycle Methods
	/**
	 * @memberof Notification
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name load
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * To be overridden by artifact implementations - for implementing custom
	 * start logic
	 *
	 */
	async load() {
		await super.load?.();
	}

	/**
	 * @memberof Notification
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name unload
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * To be overridden by artifact implementations - for implementing custom
	 * stop logic
	 *
	 */
	async unload() {
		await super.unload?.();
	}
	// #endregion

	// #region Interface API
	/**
	 * @memberof Notification
	 * @async
	 * @instance
	 * @function
	 * @name send
	 *
	 * @param {Array} notificationData - The data to be sent via notifications.
	 *
	 * @returns {null} Nothing.
	 *
	 * @description
	 * Sends out notifications based on the input data.
	 */
	async send(notificationData) {
		const logger = await this?.iocContainer?.resolve?.('Logger');
		logger?.info?.(
			`\nTODO: IMPLEMENT ACTUAL NOTIFICATION MECHANISM\nSending notifications: ${JSON.stringify?.(
				notificationData,
				undefined,
				'\t'
			)}`
		);
	}
	// #endregion

	// #region Getters / Setters
	get interface() {
		return {
			send: this?.send?.bind?.(this)
		};
	}
	// #endregion

	// #region Private Methods
	// #endregion

	// #region Private Fields
	// #endregion
}

/**
 * @class RepositoryFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The Notification Repository Class Factory.
 */
export default class RepositoryFactory extends EVASBaseFactory {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor() {
		super();
	}
	// #endregion

	// #region Lifecycle API
	/**
	 * @memberof RepositoryFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name createInstance
	 *
	 * @param {object} [configuration] - requested repository configuration
	 * @param {object} [iocContainer] - IoC Container providing DI Repositories
	 *
	 * @returns {Notification} - The Notification repository instance.
	 *
	 */
	static async createInstances(configuration, iocContainer) {
		if (!RepositoryFactory.#notificationInstance) {
			const notificationInstance = new Notification(
				RepositoryFactory['$disk_unc'],
				iocContainer,
				configuration
			);

			await notificationInstance?.load?.();
			RepositoryFactory.#notificationInstance = notificationInstance;
		}

		return RepositoryFactory.#notificationInstance?.interface;
	}

	/**
	 * @memberof RepositoryFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name destroyInstances
	 *
	 * @param {object} [configuration] - requested repository configuration
	 *
	 * @returns {undefined} - Nothing.
	 *
	 * @description Clears the cached {Notification} instances
	 */
	static async destroyInstances(configuration) {
		configuration;
		if (!RepositoryFactory.#notificationInstance) return;

		await RepositoryFactory.#notificationInstance?.unload?.();
		RepositoryFactory.#notificationInstance = undefined;
	}
	// #endregion

	// #region Getters
	/**
	 * @memberof RepositoryFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name RepositoryName
	 *
	 * @returns {string} - Name of this repository.
	 *
	 * @description
	 * Returns the name of this repository - Notification
	 */
	static get RepositoryName() {
		return 'Notification';
	}
	// #endregion

	// #region Private Static Members
	static #notificationInstance = undefined;
	// #endregion
}
