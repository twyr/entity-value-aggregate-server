'use strict';

exports.seed = async function (knex) {
	// Step 0: If this seed has been run, simply return
	const areSystemMessagesPresent = await knex?.raw?.(
		`SELECT COUNT(message_code) AS message_count FROM system_message_by_locale_master`
	);
	if (areSystemMessagesPresent?.rows?.[0]?.['message_count'] > 0) return;

	// Step 1: Insert the system messages
	await knex?.('system_message_by_locale_master')?.insert([
		{
			message_code: 'SERVER_USERS::SESSION_MANAGER::OTP_MESSAGE_SMS',
			locale_code: 'en-IN',
			message_text:
				'Your OTP for Twyr is {{otp}}. Valid until {{expiryTime}}.'
		},
		{
			message_code: 'SERVER_USERS::SESSION_MANAGER::OTP_MESSAGE_RESPONSE',
			locale_code: 'en-IN',
			message_text:
				'An OTP has been sent to your registered mobile number.'
		},
		{
			message_code:
				'SERVER_USERS::SESSION_MANAGER::EXISTING_ACTIVE_SESSION',
			locale_code: 'en-IN',
			message_text: 'Active session already exists.'
		},
		{
			message_code: 'SERVER_USERS::SESSION_MANAGER::NO_ACTIVE_SESSION',
			locale_code: 'en-IN',
			message_text: 'No active session.'
		},
		{
			message_code: 'SERVER_USERS::PROFILE::OTP_MISSING',
			locale_code: 'en-IN',
			message_text:
				'Profile cannot be created for {{first_name}} {{last_name}}. OTP mismatch.'
		},
		{
			message_code: 'SERVER_USERS::PROFILE::DUPLICATE_USER',
			locale_code: 'en-IN',
			message_text:
				'Profile cannot be created for {{first_name}} {{last_name}}. User already exists.'
		},
		{
			message_code: 'SERVER_USERS::PROFILE::MINOR_USER',
			locale_code: 'en-IN',
			message_text:
				'Profile cannot be created for {{first_name}} {{last_name}}. User is a minor.'
		}
	]);
};
