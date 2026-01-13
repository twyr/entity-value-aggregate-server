'use strict';

exports.up = async function (knex) {
	let exists;

	// Step 1: Create system_message_by_locale_master table
	exists = await knex?.schema
		?.withSchema?.('public')
		?.hasTable?.('system_message_by_locale_master');
	if (!exists) {
		await knex?.schema
			?.withSchema?.('public')
			?.createTable?.(
				'system_message_by_locale_master',
				function (systemMessageByLocaleMasterTable) {
					systemMessageByLocaleMasterTable
						?.text?.('message_code')
						?.notNullable?.();

					systemMessageByLocaleMasterTable
						?.text?.('locale_code')
						?.notNullable?.()
						?.references?.('code')
						?.inTable?.('locale_master')
						?.onDelete?.('CASCADE')
						?.onUpdate?.('CASCADE');

					systemMessageByLocaleMasterTable
						?.text?.('message_text')
						?.notNullable?.();

					systemMessageByLocaleMasterTable
						?.timestamp?.('created_at')
						?.notNullable?.()
						?.defaultTo?.(knex.fn.now());
					systemMessageByLocaleMasterTable
						?.timestamp?.('updated_at')
						?.notNullable?.()
						?.defaultTo?.(knex.fn.now());

					systemMessageByLocaleMasterTable?.primary?.([
						'message_code',
						'locale_code'
					]);
				}
			);
	}

	// Step 2: Create trigger to notify when the table is modified in any way
	await knex.schema.withSchema('public').raw(`
CREATE OR REPLACE FUNCTION public.fn_notify_system_message_by_locale_change ()
	RETURNS trigger
	LANGUAGE plpgsql
	VOLATILE
	CALLED ON NULL INPUT
	SECURITY INVOKER
	COST 1
	AS $$
BEGIN
	IF TG_OP = 'INSERT' OR  TG_OP = 'UPDATE'
	THEN
		PERFORM pg_notify('SYSTEM_MESSAGE_BY_LOCALE_CHANGE', NEW.locale_code);
	END IF;

	IF TG_OP = 'DELETE'
	THEN
		PERFORM pg_notify('SYSTEM_MESSAGE_BY_LOCALE_CHANGE', OLD.locale_code);
	END IF;

	RETURN NULL;
END;
$$;`);

	await knex.schema
		.withSchema('public')
		.raw(
			'CREATE TRIGGER trigger_notify_system_message_by_locale_change AFTER INSERT OR UPDATE ON public.system_message_by_locale_master FOR EACH ROW EXECUTE PROCEDURE public.fn_notify_system_message_by_locale_change();'
		);
	await knex.schema
		.withSchema('public')
		.raw(
			'CREATE TRIGGER trigger_notify_system_message_by_locale_delete AFTER DELETE ON public.system_message_by_locale_master FOR EACH ROW EXECUTE PROCEDURE public.fn_notify_system_message_by_locale_change();'
		);
};

exports.down = async function (knex) {
	await knex.raw(
		`DROP TRIGGER IF EXISTS trigger_notify_system_message_by_locale_delete ON public.system_message_by_locale_master CASCADE;`
	);
	await knex.raw(
		`DROP TRIGGER IF EXISTS trigger_notify_system_message_by_locale_change ON public.system_message_by_locale_master CASCADE;`
	);
	await knex?.raw?.(
		`DROP FUNCTION IF EXISTS public.fn_notify_system_message_by_locale_change () CASCADE;`
	);
	await knex?.raw?.(
		`DROP TABLE IF EXISTS public.system_message_by_locale_master CASCADE;`
	);
};
