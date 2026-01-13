'use strict';

exports.seed = async function (knex) {
	// Step 0: If this seed has been run, simply return
	const areSystemMessagesPresent = await knex?.raw?.(
		`SELECT COUNT(message_code) AS message_count FROM system_message_by_locale_master`
	);
	if (areSystemMessagesPresent?.rows?.[0]?.['message_count'] > 0) return;

	// Step 1: Insert the system message
	await knex?.('system_message_by_locale_master')?.insert({
		message_code: 'OTP_GENERATED',
		locale_code: 'en-IN',
		message_text:
			'Your OTP for AyurXOS is {{otp}}. It is valid for 10 minutes.'
	});
};
