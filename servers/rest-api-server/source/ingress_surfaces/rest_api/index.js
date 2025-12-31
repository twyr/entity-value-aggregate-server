/**
 * Imports for this file
 * @ignore
 */
import http from 'node:http';
import networkInterfaces from 'node:os';

import convertHrtime from 'convert-hrtime';
// import helmet from 'koa-helmet';

import { v4 as uuidv4 } from 'uuid';

import { EVASBaseIngressSurface } from '@twyr/framework-classes';
import { EVASBaseFactory } from '@twyr/framework-classes';
import { errorSerializer } from '@twyr/error-serializer';

/**
 * Magic Number constants
 * @ignore
 */
// const DEFAULT_MAX_EVENT_LOOP_DELAY = 10_000; // 10 seconds
const DEFAULT_MAX_PAYLOAD_SIZE = '10mb';

const DEFAULT_POWERED_BY = 'Twyr';

// const DEFAULT_RATE_LIMIT_INTERVAL = 5 * 60 * 1000; // 5 minutes
// const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 30;

const DEFAULT_SESSION_DOMAIN = '127.0.0.1';
const DEFAULT_SESSION_ENCRYPTION_KEY = 'Th1s!sTheTwyrEntityAggregateServer';
const DEFAULT_SESSION_KEY = 'twyr!entity!aggregate!server';
const DEFAULT_SESSION_MAX_AGE = 86_400_000;
const DEFAULT_SERVER_PORT = 9090;

const DEFAULT_SUBDOMAIN_MAPPING = {
	'127.0.0.1': 'www',
	localhost: 'www'
};

/**
 * @class RestApi
 * @extends EVASBaseIngressSurface
 *
 * @param {string} [location] - __dirname for this file in CJS, basically
 * @param {object} [iocContainer] - IoC module providing DI repositories
 * @param {object} [configuration] - requested repository configuration
 *
 * @classdesc The RestApi Repository Class.
 *
 */
class RestApi extends EVASBaseIngressSurface {
	// #region Constructor
	constructor(location, iocContainer, configuration) {
		super(location, iocContainer, configuration);
	}
	// #endregion

	// #region Lifecycle Methods
	/**
	 * @memberof RestApi
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

		const cache = await this?.iocContainer?.resolve?.('Cache');
		// const logger = await this?.iocContainer?.resolve?.('Logger');

		/**
		 * Step 1: Setup the configuration
		 * @ignore
		 */
		let configuration = this.configuration;
		if (!configuration) {
			const configRepository =
				await this?.iocContainer?.resolve?.('Configuration');

			configuration = await configRepository?.getConfig?.(this?.name);
		}

		const sessionConfig = {
			keys: configuration?.['SESSION_KEYS'] ?? [
				DEFAULT_SESSION_ENCRYPTION_KEY
			],
			autoCommit: true,
			domain: configuration?.['SESSION_DOMAIN'] ?? DEFAULT_SESSION_DOMAIN,
			key: configuration?.['SESSION_KEY'] ?? DEFAULT_SESSION_KEY,
			maxAge:
				configuration?.['SESSION_MAX_AGE'] ?? DEFAULT_SESSION_MAX_AGE,
			overwrite: true,
			httpOnly: true,
			signed: true,
			rolling: true,
			renew: true
		};
		sessionConfig.genid = function () {
			return `${
				configuration?.['SESSION_KEY'] ?? DEFAULT_SESSION_KEY
			}!${uuidv4()}`;
		};

		/**
		 * Step 2: Setup Koa Application.
		 * @ignore
		 */

		// Step 2.1: Instantiate Koa
		let Koa = await import('koa');
		Koa = Koa?.['default'];

		this.#koaApp = new Koa();
		this.#koaApp?.on?.('error', this.#handleKoaAppError.bind(this));

		this.#koaApp.keys = sessionConfig?.keys;
		this.#koaApp.proxy = serverEnvironment === 'production';

		// Step 2.2: The Global Error Handler
		this.#koaApp?.use?.(this.#errorLog?.bind?.(this));

		// Step 2.3: Assign each request an id to enable
		// distributed tracing...
		let requestId = await import('koa-requestid');
		requestId = requestId?.['default'];
		this.#koaApp?.use?.(
			requestId({
				expose: 'X-Request-Id',
				header: 'X-Request-Id',
				query: 'requestId'
			})
		);

		// Step 2.4: Hide the powered-by header to
		// prevent external entities from easily
		// guessing the stack
		this.#koaApp?.use?.(async (ctxt, next) => {
			ctxt?.request?.socket?.setNoDelay?.(true);

			ctxt.headers['x-request-id'] = ctxt?.state?.id;
			ctxt?.set?.(
				'x-powered-by',
				configuration?.['POWERED_BY'] ?? DEFAULT_POWERED_BY
			);

			await next();
		});

		// Step 2.5: The security stuff... only in prod mode, though
		// Blacklists, whitelists, csp, rate limits, etc.
		/*
		if (serverEnvironment === 'production') {
			// Step 2.5.1: Check for blacklisted IPS from the Honeypot project
			// TODO: Have to find a decent implementation of the Honeypot API

			// Step 2.5.2: Content Security Policy, et al.
			this.#koaApp?.use?.(
				helmet?.({
					hidePoweredBy: false,
					hpkp: false,
					hsts: false
				})		this.#sqldbInstances?.forEach?.((sqlDatabaseInstance) => {

			);

			// Step 2.5.3: Check if IP is whitelisted
			let koaCors = await import('@koa/cors');
			koaCors = koaCors?.['default'];

			this.#koaApp?.use?.(
				koaCors?.({
					credentials: true,
					keepHeadersOnError: true
				})
			);

			// Step 2.5.4: Whitelisted, but asking for too much?
			// Sorry, dude... gotta limit you from using all the resources
			let koaRateLimiter = await import('koa-ratelimit');
			koaRateLimiter = koaRateLimiter?.['default'];

			this.#koaApp?.use?.(
				koaRateLimiter?.({
					db: cache,
					duration:
						configuration?.['RATE_LIMIT_INTERVAL'] ??
						DEFAULT_RATE_LIMIT_INTERVAL,
					max:
						configuration?.['RATE_LIMIT_MAX_REQUESTS'] ??
						DEFAULT_RATE_LIMIT_MAX_REQUESTS
				})
			);

			// Step 2.5.5: Overload protection... really, bro
			// not your fault - I just can't ...
			let overloadProtection = await import('overload-protection');
			overloadProtection = overloadProtection?.['default'];

			const koaProtect = overloadProtection?.('koa', {
				maxEventLoopDelay:
					configuration?.['MAX_EVENT_LOOP_DELAY'] ??
					DEFAULT_MAX_EVENT_LOOP_DELAY,
				logging: logger
			});

			this.#koaApp?.use?.(koaProtect);
		}
		*/

		// Step 2.6: Add in the device identifier
		let device = await import('device');
		device = device?.['default'];

		this.#koaApp?.use?.(async (ctxt, next) => {
			ctxt.state.device = device?.(ctxt?.headers?.['user-agent'] ?? '');
			await next();
		});

		// Step 2.7: Figure out which tenant this is..
		this.#koaApp?.use?.(this.#setTenant?.bind?.(this));

		// Step 2.8: Sessions
		let koaSessionRedisStore = await import('koa-redis');
		koaSessionRedisStore = koaSessionRedisStore?.['default'];

		sessionConfig.store = koaSessionRedisStore?.({
			client: cache,
			duplicate: false
		});

		let koaSession = await import('koa-session');
		koaSession = koaSession?.['default']?.(sessionConfig, this.#koaApp);
		koaSession?.on?.(
			'session:missed',
			this.#handleKoaSessionEvents?.bind?.(this)
		);

		koaSession?.on?.(
			'session:invalid',
			this.#handleKoaSessionEvents?.bind?.(this)
		);

		koaSession?.on?.(
			'session:expired',
			this.#handleKoaSessionEvents?.bind?.(this)
		);

		this.#koaApp.use?.(koaSession);

		// Step 2.9: Passport based authentication...
		const authRepository = await this?.iocContainer?.resolve?.('Auth');

		this.#koaApp?.use?.(authRepository?.initialize?.());
		this.#koaApp?.use?.(authRepository?.session?.());

		// Step 2.10: The body parsers...
		const bodyParserConfig = {
			jsonLimit:
				configuration?.['MAX_PAYLOAD_SIZE'] ?? DEFAULT_MAX_PAYLOAD_SIZE,
			textLimit:
				configuration?.['MAX_PAYLOAD_SIZE'] ?? DEFAULT_MAX_PAYLOAD_SIZE,
			xmlLimit:
				configuration?.['MAX_PAYLOAD_SIZE'] ?? DEFAULT_MAX_PAYLOAD_SIZE,
			enableTypes: ['json', 'text', 'xml'],
			extendTypes: {
				json: ['application/x-javascript', 'application/vnd.api+json']
			},
			onError: this.#handleKoaBodyParserError?.bind?.(this)
		};

		let koaBodyParser = await import('koa-bodyparser');
		koaBodyParser = koaBodyParser?.['default'];

		this.#koaApp?.use?.(koaBodyParser(bodyParserConfig));

		// Step 2.11: The audit log hook...
		this.#koaApp?.use(this.#auditLog?.bind?.(this));

		// Finally, add in the router...
		let Router = await import('@koa/router');
		Router = Router?.['default'];

		this.#router = new Router();

		this.#koaApp?.use?.(this.#router.routes());
		this.#koaApp?.use?.(this.#router.allowedMethods());
	}

	/**
	 * @memberof RestApi
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

		this.#router = undefined;
		this.#koaApp = undefined;
	}
	// #endregion

	// #region Interface API
	/**
	 * @memberof RestApi
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name start
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Starts listening on the configured port.
	 */
	async start() {
		if (this.#protocolServer) return;

		const networkList = networkInterfaces?.networkInterfaces?.();

		let configuration = this.configuration;
		if (!configuration) {
			const configRepository =
				await this?.iocContainer?.resolve?.('Configuration');

			configuration = await configRepository?.getConfig?.(this?.name);
		}

		// Step 1: Create the Server
		this.#protocolServer = http?.createServer?.(this.#koaApp?.callback?.());

		// Step 2: Start listening to events
		this.#protocolServer?.on?.(
			'connection',
			this.#serverConnection?.bind?.(this)
		);

		this.#protocolServer?.on?.(
			'error',
			this.#handleProtocolServerError?.bind?.(this)
		);

		// Step 3: Listen on configured port...
		const listenPort = Number?.(
			configuration?.['SERVER_PORT'] ?? DEFAULT_SERVER_PORT
		);

		return new Promise((resolve, reject) => {
			this.#protocolServer?.listen?.(listenPort, () => {
				try {
					if (serverEnvironment === 'production') {
						resolve?.();
						return;
					}

					console?.info?.(
						`\n${this?.name}::start: ${JSON?.stringify?.(
							this.#router?.stack?.map?.((route) => {
								const routeMethodPaths = route?.methods
									?.map((method) => {
										if (method === 'HEAD') return;
										return `${method} ${route?.path}`;
									})
									?.filter((routeMethodPath) => {
										return !!routeMethodPath;
									});

								return routeMethodPaths?.length > 1
									? routeMethodPaths
									: routeMethodPaths?.shift?.();
							}),
							undefined,
							'\t'
						)}`
					);

					const forPrint = [];
					Object.keys(networkList).forEach((networkName) => {
						const networkInterfaceAddresses =
							// eslint-disable-next-line security/detect-object-injection
							networkList?.[networkName];

						for (const address of networkInterfaceAddresses)
							forPrint.push({
								Interface: networkName,
								Protocol: address.family,
								Address: address.address,
								Port: listenPort
							});
					});

					console?.table?.(forPrint);
					resolve?.();
				} catch (error) {
					reject?.(error);
				}
			});
		});
	}

	/**
	 * @memberof RestApi
	 * @async
	 * @instance
	 * @override
	 * @function
	 * @name stop
	 *
	 * @returns {null} - Nothing
	 *
	 * @description
	 * Stops listening on the configured port.
	 */
	async stop() {
		if (!this.#protocolServer) return;

		this.#koaApp.off('error', this.#handleKoaAppError.bind(this));

		this.#protocolServer.off(
			'error',
			this.#handleProtocolServerError.bind(this)
		);

		this.#protocolServer.off(
			'connection',
			this.#serverConnection.bind(this)
		);

		this.#protocolServer?.closeAllConnections?.();
		this.#protocolServer?.close?.();

		this.#router.stack.length = 0;
		this.#protocolServer = undefined;
	}
	// #endregion

	// #region Getters / Setters
	get interface() {
		return {
			router: this.#router,

			start: this?.start?.bind?.(this),
			stop: this?.stop?.bind?.(this)
		};
	}
	// #endregion

	// #region Private Methods
	async #errorLog(ctxt, next) {
		try {
			await next();
		} catch (error) {
			ctxt.type = 'application/json; charset=utf-8';
			ctxt.status = error?.status ?? 422;
			ctxt.body = error?.message;
		}
	}

	async #setTenant(ctxt, next) {
		// Step 0: Get the dependencies...
		const cache = await this?.iocContainer?.resolve?.('Cache');
		const database = await this?.iocContainer?.resolve?.('SQLDatabase');

		let configuration = this.configuration;
		if (!configuration) {
			const configRepository =
				await this?.iocContainer?.resolve?.('Configuration');

			configuration = await configRepository?.getConfig?.(this?.name);
		}

		// Step 1: Figure out the sub-domain from the Koa context
		let tenantSubDomain =
			configuration?.['SUBDOMAIN_MAPPING']?.[
				configuration?.['SESSION_DOMAIN'] ?? 'DEFAULT_SESSION_DOMAIN'
			] ??
			DEFAULT_SUBDOMAIN_MAPPING?.[
				configuration?.['SESSION_DOMAIN'] ?? 'DEFAULT_SESSION_DOMAIN'
			];

		if (ctxt.subdomains.length === 1) tenantSubDomain = ctxt.subdomains[0];

		if (ctxt.subdomains.length > 1) {
			ctxt.subdomains.reverse();
			tenantSubDomain = ctxt.subdomains.join('.');
			ctxt.subdomains.reverse();
		}

		// Step 2: See if the sub-domain is an alias, and modify accordingly
		tenantSubDomain =
			// eslint-disable-next-line security/detect-object-injection
			configuration?.['SUBDOMAIN_MAPPING']?.[tenantSubDomain] ??
			// eslint-disable-next-line security/detect-object-injection
			DEFAULT_SUBDOMAIN_MAPPING?.[tenantSubDomain] ??
			tenantSubDomain;

		// Step 3: Get tenant from the cache if already present
		let tenant = ctxt?.get?.['tenant'];
		if (!tenant) {
			tenant = await cache?.get?.(
				`twyr!entity!aggregate!server!tenant!${tenantSubDomain}`
			);
		}

		if (tenant) {
			tenant = JSON?.parse?.(tenant);

			ctxt.state.tenant = tenant;
			ctxt.request.headers['tenant'] = JSON?.stringify?.(tenant);

			await next?.();
			return;
		}

		// Step 4: Get tenant from the database
		if (!tenant) {
			tenant = await database?.raw?.(
				`SELECT id, name, sub_domain FROM tenants WHERE sub_domain = ?`,
				[tenantSubDomain]
			);

			tenant = tenant?.rows?.shift?.();
		}

		// Step 5: Throw if we cannot find a tenant
		if (!tenant) {
			throw new Error(`Tenant ${tenantSubDomain} not found`);
		}

		// Step 6: Setup the domains / features this tenant has access to
		let tenantModules = await database?.raw?.(
			`SELECT id, parent_id, name from artifacts WHERE id IN (SELECT artifact_id FROM tenants_artifacts WHERE tenant_id = ?) AND artifact_type_id <> (SELECT id FROM artifact_type_master WHERE name = 'server')`,
			[tenant?.id]
		);

		tenant['domains'] = tenantModules?.rows;

		// Step 7: Store tenant stuff in the cache for faster access from the next request
		const cacheMulti = await cache?.multi?.();
		cacheMulti?.set?.(
			`twyr!entity!aggregate!server!tenant!${tenantSubDomain}`,
			JSON?.stringify?.(tenant)
		);
		cacheMulti?.expire?.(
			`twyr!entity!aggregate!server!tenant!${tenantSubDomain}`,
			serverEnvironment === 'development' ? 3600 : 86_400
		);

		await cacheMulti?.exec?.();

		ctxt.state.tenant = tenant;
		ctxt.request.headers['tenant'] = JSON?.stringify?.(tenant);

		await next?.();
	}

	async #auditLog(ctxt, next) {
		let safeJsonStringify = await import('safe-json-stringify');
		safeJsonStringify = safeJsonStringify?.['default'];

		const requestHeaders = {};
		for (const requestHeader in ctxt?.request?.headers ?? {}) {
			if (requestHeader === 'tenant') continue;

			// eslint-disable-next-line security/detect-object-injection
			requestHeaders[requestHeader] = JSON?.parse?.(
				// eslint-disable-next-line security/detect-object-injection
				safeJsonStringify?.(ctxt?.request?.headers?.[requestHeader])
			);
		}

		const logMessageMeta = {
			id: ctxt?.state?.id,

			start_time: undefined,
			end_time: undefined,
			duration_in_ms: 0,

			user: {
				id: ctxt?.state?.user?.id,
				name: `${ctxt?.state?.user?.['first_name']} ${ctxt?.state?.user?.['last_name']}`
			},
			tenant: {
				id: ctxt?.state?.tenant?.id,
				sub_domain: ctxt?.state?.tenant?.sub_domain,
				name: ctxt?.state?.tenant?.name
			},

			'request-meta': {
				headers: requestHeaders,
				method: ctxt?.request?.method,
				url: ctxt?.request?.url,
				ip: ctxt?.request?.ip,
				ips: JSON?.parse?.(
					safeJsonStringify?.(ctxt?.request?.ips ?? [])
				)
			},

			'response-meta': {},

			data: {
				query: JSON?.parse?.(safeJsonStringify?.(ctxt?.query || {})),
				params: JSON?.parse?.(safeJsonStringify?.(ctxt?.params || {})),
				body: JSON?.parse?.(
					safeJsonStringify?.(ctxt?.request?.body || {})
				),
				payload: undefined
			},

			error: undefined
		};

		const startTime = process?.hrtime?.bigint?.();
		logMessageMeta['start_time'] = new Date()?.valueOf?.();
		try {
			await next?.();
		} catch (error) {
			logMessageMeta['error'] = error;
		}
		logMessageMeta['end_time'] = new Date()?.valueOf?.();
		const endTime = process?.hrtime?.bigint?.();

		if (!logMessageMeta?.user?.id) {
			logMessageMeta['user'] = {
				id: ctxt?.state?.user?.['id'] ?? '???',
				name: `${ctxt?.state?.user?.['first_name'] ?? '???'} ${
					ctxt?.state?.user?.['last_name'] ?? '???'
				}`
			};
		}

		if (!logMessageMeta?.tenant?.id) {
			logMessageMeta['tenant'] = {
				id: ctxt?.state?.tenant?.['id'] ?? '???',
				name: ctxt?.state?.tenant?.['name'] ?? '???',
				subDomain: ctxt?.state?.tenant?.['sub_domain'] ?? '???'
			};
		}

		logMessageMeta['duration_in_ms'] = convertHrtime?.(
			endTime - startTime
		)?.milliseconds;

		logMessageMeta['response-meta']['headers'] = JSON?.parse?.(
			safeJsonStringify?.(ctxt?.response?.headers)
		);

		const statusCodes = http?.['STATUS_CODES'];
		logMessageMeta['response-meta']['status'] = {
			code: logMessageMeta?.error?.status ?? ctxt?.status,
			message:
				logMessageMeta?.error?.message ?? statusCodes?.[ctxt?.status],
			responseMessage:
				((logMessageMeta?.error?.message ?? '')?.startsWith?.(
					'ApiMatcher'
				)
					? logMessageMeta?.error?.cause?.message
					: logMessageMeta?.error?.message) ??
				statusCodes?.[ctxt?.status]
		};

		logMessageMeta['data']['payload'] = Buffer?.isBuffer?.(ctxt?.body)
			? 'BUFFER'
			: JSON?.parse?.(safeJsonStringify?.(ctxt?.body || {}));

		logMessageMeta['error'] ??= ctxt?.status >= 400;

		let throwableError;
		if (logMessageMeta?.['error'] instanceof Error) {
			throwableError = logMessageMeta?.['error'];
			logMessageMeta['error'] = errorSerializer?.(
				logMessageMeta?.['error']
			);
		}

		const auditRepository = await this?.iocContainer?.resolve?.('Audit');
		auditRepository?.publish?.(logMessageMeta);

		if (!throwableError) return;

		if (throwableError?.message?.startsWith?.('ApiMatcher'))
			throw throwableError?.cause ?? throwableError;

		throw throwableError;
	}

	async #serverConnection(socket) {
		const logger = await this?.iocContainer?.resolve?.('Logger');
		logger?.debug?.(`Server Connections: ${socket?._server?._connections}`);
	}

	async #handleProtocolServerError() {
		let safeJsonStringify = await import('safe-json-stringify');
		safeJsonStringify = safeJsonStringify?.['default'];

		const logger = await this?.iocContainer?.resolve?.('Logger');
		logger?.error?.(
			`Server Error: ${safeJsonStringify?.(arguments, undefined, '\t')}`
		);
	}

	async #handleKoaAppError() {
		let safeJsonStringify = await import('safe-json-stringify');
		safeJsonStringify = safeJsonStringify?.['default'];

		const logger = await this?.iocContainer?.resolve?.('Logger');
		logger?.error?.(
			`Koa App Error: ${safeJsonStringify?.(arguments, undefined, '\t')}`
		);
	}

	async #handleKoaSessionEvents() {
		let safeJsonStringify = await import('safe-json-stringify');
		safeJsonStringify = safeJsonStringify?.['default'];

		const logger = await this?.iocContainer?.resolve?.('Logger');
		logger?.info?.(
			`Koa Session Event: ${safeJsonStringify?.(
				arguments,
				undefined,
				'\t'
			)}`
		);
	}

	async #handleKoaBodyParserError() {
		let safeJsonStringify = await import('safe-json-stringify');
		safeJsonStringify = safeJsonStringify?.['default'];

		const logger = await this?.iocContainer?.resolve?.('Logger');
		logger?.error?.(
			`Koa Body Parser Error: ${safeJsonStringify?.(
				arguments,
				undefined,
				'\t'
			)}`
		);
	}
	// #endregion

	// #region Private Fields
	#router = undefined;

	#koaApp = undefined;
	#protocolServer = undefined;
	// #endregion
}

/**
 * @class IngressSurfaceFactory
 * @extends EVASBaseFactory
 *
 * @classdesc The RestApi Ingress Surface Class Factory.
 */
export default class IngressSurfaceFactory extends EVASBaseFactory {
	// #region Constructor
	// eslint-disable-next-line jsdoc/require-jsdoc
	constructor() {
		super();
	}
	// #endregion

	// #region Lifecycle API
	/**
	 * @memberof IngressSurfaceFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name createInstance
	 *
	 * @param {object} [configuration] - requested repository configuration
	 * @param {object} [iocContainer] - IoC Container providing DI Repositories
	 *
	 * @returns {RestApi} - The RestApi repository instance.
	 *
	 */
	static async createInstances(configuration, iocContainer) {
		if (!IngressSurfaceFactory.#restApiInstance) {
			const restApiInstance = new RestApi(
				IngressSurfaceFactory['$disk_unc'],
				iocContainer,
				configuration
			);

			await restApiInstance?.load?.();
			IngressSurfaceFactory.#restApiInstance = restApiInstance;
		}

		return IngressSurfaceFactory.#restApiInstance?.interface;
	}

	/**
	 * @memberof IngressSurfaceFactory
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
	 * @description Clears the cached {RestApi} instances
	 */
	// eslint-disable-next-line no-unused-vars
	static async destroyInstances(configuration = 'server') {
		if (!IngressSurfaceFactory.#restApiInstance) return;

		await IngressSurfaceFactory.#restApiInstance?.unload?.();
		IngressSurfaceFactory.#restApiInstance = undefined;

		return;
	}
	// #endregion

	// #region Getters
	/**
	 * @memberof IngressSurfaceFactory
	 * @async
	 * @static
	 * @override
	 * @function
	 * @name IngressSurfaceName
	 *
	 * @returns {string} - Name of this repository.
	 *
	 * @description
	 * Returns the name of this repository - RestApi
	 */
	static get IngressSurfaceName() {
		return 'RestApi';
	}
	// #endregion

	// #region Private Static Members
	static #restApiInstance = undefined;
	// #endregion
}
