/**
 * Imports for this file
 * @ignore
 */
import { BaseMiddleware } from 'baseclass:middleware';

/**
 * Magic Number constants
 * @ignore
 */

/**
 * @class ServerUserBaseMiddleware
 * @extends BaseMiddleware
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [domainInterface] - Domain functionality exposed to sub-artifacts
 *
 * @classdesc The Base Class for all Middlewares in the ServerUser Domain.
 */
export class ServerUserBaseMiddleware extends BaseMiddleware {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor(location, domainInterface) {
		super(location, domainInterface);
	}
	// #endregion

	// #region Lifecycle Methods
	/**
	 * @memberof ServerUserBaseMiddleware
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
	 * @memberof ServerUserBaseMiddleware
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

	// #region Protected Methods, to be overridden by derived classes
	/**
	 * @memberof ServerUserBaseMiddleware
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _registerApi
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * To be overridden by artifact implementations - for adding their API
	 * to the apiRegistry in the domainInterface
	 *
	 */
	async _registerApi() {
		return super._registerApi();
	}

	/**
	 * @memberof ServerUserBaseMiddleware
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _unregisterApi
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * To be overridden by artifact implementations - for removing their API
	 * from the apiRegistry in the domainInterface
	 *
	 */
	async _unregisterApi() {
		return super._unregisterApi();
	}
	// #endregion

	// #region "Protected" methods
	/**
	 * @memberof ServerUserBaseMiddleware
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _createServerUserEntity
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Creates the server-user-dependant entity in the database
	 *
	 */
	async _createServerUserEntity(data) {
		const EntityModel = await this?._getModelsFromDomain?.(data?.model);

		// Step 1: De-serialize from JSON API Format
		const serverUserEntity =
			await this?.domainInterface?.serializer?.deserializeAsync?.(
				data?.payload?.data?.type,
				data?.payload
			);

		delete serverUserEntity.id;
		delete serverUserEntity.created_at;
		delete serverUserEntity.updated_at;

		serverUserEntity.server_user_id = data?.user?.id;

		// Step 3: Do the dew!
		let createdEntity = await this?._executeWithBackOff?.(async () => {
			return EntityModel?.query?.()
				?.insertAndFetch?.(serverUserEntity)
				?.withGraphFetched?.(data?.relationships);
		});

		createdEntity =
			await this?.domainInterface?.serializer?.serializeAsync?.(
				data?.payload?.data?.type,
				createdEntity
			);

		// Step 4: Emit event
		this?.domainInterface?.eventEmitter?.emit?.(data?.eventName, {
			serverUserId: data?.serverUserId,
			entityId: createdEntity?.id
		});

		this?.domainInterface?.eventEmitter?.emit?.('SERVER_USER::LOGOUT', {
			userId: data?.serverUserId
		});

		return {
			status: 201,
			body: createdEntity
		};
	}

	/**
	 * @memberof ServerUserBaseMiddleware
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _readServerUserEntity
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Fetches the server-user-dependant entity from the database
	 *
	 */
	async _readServerUserEntity(data) {
		const EntityModel = await this?._getModelsFromDomain?.(data?.model);

		let serverUserEntities = undefined;
		if (!data?.entityId) {
			serverUserEntities = await this?._executeWithBackOff?.(async () => {
				return EntityModel?.query?.()
					?.where?.('server_user_id', '=', data?.user?.id)
					?.withGraphFetched?.(data?.relationships);
			});
		} else {
			serverUserEntities = await this?._executeWithBackOff?.(async () => {
				return EntityModel?.query?.()
					?.where?.('id', '=', data?.entityId)
					?.andWhere?.('server_user_id', '=', data?.user?.id)
					?.withGraphFetched?.(data?.relationships);
			});
		}

		serverUserEntities =
			await this?.domainInterface?.serializer?.serializeAsync?.(
				data?.serializeType,
				serverUserEntities
			);

		return {
			status: 200,
			body: serverUserEntities
		};
	}

	/**
	 * @memberof ServerUserBaseMiddleware
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _updateServerUserEntity
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Updates the server-user-dependant entity in the database
	 *
	 */
	async _updateServerUserEntity(data) {
		const EntityModel = await this?._getModelsFromDomain?.(data?.model);

		// Step 1: De-serialize from JSON API Format
		const serverUserEntity =
			await this?.domainInterface?.serializer?.deserializeAsync?.(
				data?.payload?.data?.type,
				data?.payload
			);

		delete serverUserEntity.created_at;
		delete serverUserEntity.updated_at;

		serverUserEntity.server_user_id = data?.user?.id;

		// Step 2: Do the dew!
		let updatedEntity = await this?._executeWithBackOff?.(async () => {
			return EntityModel?.query?.()
				?.patchAndFetchById?.(serverUserEntity?.id, serverUserEntity)
				?.withGraphFetched?.(data?.relationships);
		});

		updatedEntity =
			await this?.domainInterface?.serializer?.serializeAsync?.(
				data?.payload?.data?.type,
				updatedEntity
			);

		// Step 4: Emit event
		this?.domainInterface?.eventEmitter?.emit?.(data?.eventName, {
			serverUserId: data?.serverUserId,
			entityId: updatedEntity?.id
		});

		this?.domainInterface?.eventEmitter?.emit?.('SERVER_USER::LOGOUT', {
			userId: data?.serverUserId
		});

		return {
			status: 201,
			body: updatedEntity
		};
	}

	/**
	 * @memberof ServerUserBaseMiddleware
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name _deleteServerUserEntity
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Deletes the server-user-dependant entity from the database
	 *
	 */
	async _deleteServerUserEntity(data) {
		const EntityModel = await this?._getModelsFromDomain?.(data?.model);

		await this?._executeWithBackOff?.(async () => {
			return EntityModel?.query?.()
				?.deleteById?.(data?.entityId)
				?.andWhere?.('server_user_id', '=', data?.user?.id);
		});

		// Step 4: Emit event
		this?.domainInterface?.eventEmitter?.emit?.(data?.eventName, {
			serverUserId: data?.user?.id,
			entityId: data?.entityId
		});

		this?.domainInterface?.eventEmitter?.emit?.('SERVER_USER::LOGOUT', {
			userId: data?.serverUserId
		});

		return {
			status: 204
		};
	}
	// #endregion
}
