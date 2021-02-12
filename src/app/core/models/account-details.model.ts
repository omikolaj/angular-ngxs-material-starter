/**
 * Account details model.
 */
export interface AccountDetails {
	email: string;
	emailConfirmed: boolean;
	twoFactorEnabled: boolean;
	hasAuthenticator: boolean;
	twoFactorClientRemembered: boolean;
	recoveryCodesLeft: string;
}
