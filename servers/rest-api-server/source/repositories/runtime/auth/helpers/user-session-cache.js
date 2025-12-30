const getUserDetails = async function getUserDetails(
	tenantId,
	userId,
	cacheRepository,
	databaseRepository
) {
	// Step 1: Get the details from the cache, if present
	let cachedUser = await cacheRepository?.get?.(
		`twyr!entity!aggregate!server!user!${userId}!basics`
	);
	if (cachedUser) {
		cachedUser = JSON?.parse?.(cachedUser);
		return cachedUser;
	}

	// Step 2: Get the details from the database, if present
	cachedUser = await databaseRepository?.raw?.(
		`SELECT * FROM users WHERE id = ?`,
		[userId]
	);
	cachedUser = cachedUser?.rows?.shift?.();
	if (!cachedUser) throw new Error(`User with id: ${userId} not found`);
	delete cachedUser['password'];

	// Step 3: Get the contact details
	const contactDetails = await databaseRepository?.raw?.(
		`SELECT B.name as type, A.contact AS contact, A.verified AS verified FROM user_contacts A INNER JOIN contact_type_master B ON (A.contact_type_id = B.id)  WHERE A.user_id = ?`,
		[userId]
	);
	cachedUser['contacts'] = contactDetails?.rows;

	// Step 4: Set the details in the cache for the future...
	const cacheMulti = await cacheRepository?.multi?.();
	cacheMulti?.set?.(
		`twyr!entity!aggregate!server!user!${userId}!basics`,
		JSON?.stringify?.(cachedUser)
	);
	cacheMulti?.expire?.(
		`twyr!entity!aggregate!server!user!${userId}!basics`,
		serverEnvironment === 'development' ? 300 : 86_400
	);

	await cacheMulti?.exec?.();

	// Finally, return the details...
	return cachedUser;
};

const getTenantUserPermissions = async function getTenantUserPermissions(
	tenantId,
	userId,
	cacheRepository,
	databaseRepository
) {
	// Step 1: Get the details from the cache, if present
	let cachedPermissions = await cacheRepository?.get?.(
		`twyr!entity!aggregate!server!user!${userId}!${tenantId}!permissions`
	);
	if (cachedPermissions) {
		cachedPermissions = JSON?.parse?.(cachedPermissions);
		return cachedPermissions;
	}

	// Step 2: Get the list of permissions from the cache / database
	let allPermissions = await cacheRepository?.get?.(
		`twyr!entity!aggregate!server!permissions`
	);

	if (allPermissions) {
		allPermissions = JSON?.parse?.(allPermissions);
	} else {
		let serverPermissions = await databaseRepository?.raw?.(
			`SELECT id, name, implies_permissions FROM artifact_permissions`
		);

		allPermissions = [];
		serverPermissions?.rows?.forEach?.((serverPermission) => {
			allPermissions?.push?.({
				id: serverPermission?.id,
				name: serverPermission?.['name'],
				impliedPermissions: serverPermission?.['implies_permissions']
			});
		});

		await cacheRepository?.set?.(
			`twyr!entity!aggregate!server!permissions`,
			JSON?.stringify?.(allPermissions)
		);
	}

	// Step 3: Get user permissions - for this tenant - from the database
	let userPermissions = await databaseRepository?.raw?.(
		`SELECT * FROM fn_get_user_permissions(?, ?)`,
		[tenantId, userId]
	);
	userPermissions = userPermissions?.rows;
	console?.log?.(JSON.stringify(userPermissions, undefined, '\t'));

	// Step 4: If user is a superuser....
	let tenantUserPermissions = new Set();
	userPermissions?.forEach?.((userPermission) => {
		tenantUserPermissions?.add?.(userPermission?.name);
		userPermission?.['implies_permissions']?.forEach?.(
			(impliedPermission) => {
				tenantUserPermissions?.add?.(impliedPermission);
			}
		);
	});
	tenantUserPermissions = Array?.from?.(tenantUserPermissions);

	// Step 5: Set the details in the cache for the future...
	const cacheMulti = await cacheRepository?.multi?.();
	cacheMulti?.set?.(
		`twyr!entity!aggregate!server!user!${userId}!${tenantId}!permissions`,
		JSON?.stringify?.(tenantUserPermissions)
	);
	cacheMulti?.expire?.(
		`twyr!entity!aggregate!server!user!${userId}!${tenantId}!permissions`,
		serverEnvironment === 'development' ? 300 : 86_400
	);

	await cacheMulti?.exec?.();

	// Finally, return the details...
	return tenantUserPermissions;
};

/**
 * @async
 * @function
 * @name userSessionCache
 *
 * @param {string} [tenantId] - GUID representing a Tenant
 * @param {string} [userId] - GUID representing a User
 * @param {object} [cacheRepository] - Instance of cache repository
 * @param {object} [databaseRepository] - Instance of sql_database repository
 *
 * @returns {object} - User details from the cache
 *
 * @description
 * Retrieves User details from the database / cache and returns it
 *
 */
export default async function userSessionCache(
	tenantId,
	userId,
	cacheRepository,
	databaseRepository
) {
	// Step 1: Get the basics...
	const userDetails = await getUserDetails(
		tenantId,
		userId,
		cacheRepository,
		databaseRepository
	);

	const userPermissions = await getTenantUserPermissions(
		tenantId,
		userId,
		cacheRepository,
		databaseRepository
	);

	if (!userDetails['tenants']) userDetails['tenants'] = {};
	// eslint-disable-next-line security/detect-object-injection
	if (!userDetails['tenants'][tenantId])
		// eslint-disable-next-line security/detect-object-injection
		userDetails['tenants'][tenantId] = {};

	// eslint-disable-next-line security/detect-object-injection
	userDetails['tenants'][tenantId]['permissions'] = userPermissions;
	return userDetails;
}
