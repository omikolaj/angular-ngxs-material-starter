import { StateToken, StateContext, State, Selector, Action } from '@ngxs/store';
import { Injectable } from '@angular/core';
import produce from 'immer';
import * as Auth from './auth.store.actions';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { isBefore, add, getUnixTime, fromUnixTime } from 'date-fns';
import { LogService } from '../logger/log.service';
import { ACTIVE_UNTIL } from '../user-session-activity/user-session-activity-key';
import { Observable } from 'rxjs';
import { AuthStateModel, AUTH_KEY } from './auth-state-model';
import { ActiveAuthType } from '../models/auth/active-auth-type.model';

const AUTH_STATE_TOKEN = new StateToken<AuthStateModel>('auth');

@State<AuthStateModel>({
	name: AUTH_STATE_TOKEN,
	defaults: {
		isAuthenticated: false,
		access_token: '',
		expires_at: 0,
		rememberMe: false,
		username: '',
		is2StepVerificationRequired: false,
		is2StepVerificationSuccessful: false,
		isRedeemRecoveryCodeSuccessful: false,
		userId: '',
		activeAuthType: 'sign-in-active',
		passwordResetCompleted: false
	}
})
@Injectable()

/**
 * Provides all action handlers for user authentication.
 */
export class AuthState {
	/**
	 * Selects state of user's token. User explicitly signed out if access token is empty string.
	 * @param state
	 * @param expiresAt
	 * @returns true if is token expired
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectDidUserExplicitlySignout(state: AuthStateModel): boolean {
		return state.access_token === '';
	}

	/**
	 * Selects expires_at value from local storage and converts it to Date.
	 * @param state
	 * @returns date of expires at
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectCurrentUserId(state: AuthStateModel): string {
		return state.userId;
	}

	/**
	 * Selectors access token.
	 * @param state
	 * @returns access token
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectAccessToken(state: AuthStateModel): string {
		return state.access_token || '';
	}

	/**
	 * Selects whether user selected remember me option.
	 * @param state
	 * @returns true if remember me
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectRememberMe(state: AuthStateModel): boolean {
		return state.rememberMe;
	}

	/**
	 * Selects username from the store.
	 * @param state
	 * @returns username
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectUsername(state: AuthStateModel): string {
		return state.username;
	}

	/**
	 * Selects active auth type, either sign-in or sign-up.
	 * @param state
	 * @returns active auth type
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectActiveAuthType(state: AuthStateModel): ActiveAuthType {
		return state.activeAuthType;
	}

	/**
	 * Selectors whether two step verification code was successfully verified.
	 * @param state
	 * @returns true if is2 step verification successful
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectIs2StepVerificationSuccessful(state: AuthStateModel): boolean {
		return state.is2StepVerificationSuccessful;
	}

	/**
	 * Selectors whether recovery code was successfully redeemed.
	 * @param state
	 * @returns true if is2 step verification successful
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectIsRedeemRecoveryCodeSuccessful(state: AuthStateModel): boolean {
		return state.isRedeemRecoveryCodeSuccessful;
	}

	/**
	 * Selects user authentication status.
	 * @param state
	 * @returns true if is authenticated.
	 */
	@Selector([AuthState._selectExpiresAt])
	static selectIsAuthenticated(state: AuthStateModel, expires_at: Date): boolean {
		return state.isAuthenticated && isBefore(new Date(), expires_at);
	}

	/**
	 * Selects user authenticated function. This is required to actively check if user is authenticated or not.
	 * @param state
	 * @returns is authenticated func
	 */
	@Selector([AuthState._selectExpiresAt])
	static selectIsAuthenticatedFunc(state: AuthStateModel): (date: Date, expires_at: Date) => boolean {
		return (date: Date, expires_at: Date) => state.isAuthenticated && isBefore(date, expires_at);
	}

	/**
	 * Selectors the time in seconds when the token will expire in.
	 * @param state
	 * @param expires_at
	 * @returns expires in seconds
	 */
	@Selector([AuthState._selectExpiresAt])
	static selectExpiresInSeconds(state: AuthStateModel, expires_at: Date): number {
		const difference = expires_at.getTime() - new Date().getTime();
		const seconds = difference / 1000;
		return Math.abs(seconds);
	}

	/**
	 * Selects the raw expires_at value without converting it to Date.
	 * @param state
	 * @returns expires at raw
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectExpiresAtRaw(state: AuthStateModel): number {
		return state.expires_at;
	}

	/**
	 * Selects whether user's password reset request completed without errors.
	 * @param state
	 * @returns true if password reset completed
	 */
	@Selector([AUTH_STATE_TOKEN])
	static selectPasswordResetCompleted(state: AuthStateModel): boolean {
		return state.passwordResetCompleted;
	}

	/**
	 * Selects expires_at value from local storage and converts it to Date.
	 * @param state
	 * @returns date of expires at
	 */
	@Selector([AUTH_STATE_TOKEN])
	private static _selectExpiresAt(state: AuthStateModel): Date {
		return fromUnixTime(state.expires_at || 0);
	}

	/**
	 * Creates an instance of auth state.
	 * @param router
	 * @param localStorageService
	 */
	constructor(private _localStorageService: LocalStorageService, private _log: LogService) {}

	/**
	 * Action handler that updates remember me option.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.RememberMeOptionChange)
	rememberMe(ctx: StateContext<AuthStateModel>, action: Auth.RememberMeOptionChange): Observable<void> {
		this._log.info('rememberMe action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				// clear out username everytime this option changes. It is set only when user successfully logs in.
				draft.username = '';
			})
		);

		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that remembers username in local storage.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.UpdateRememberMeUsername)
	updateRememberMeUsername(ctx: StateContext<AuthStateModel>, action: Auth.UpdateRememberMeUsername): Observable<void> {
		this._log.info('updateRememberMeUsername action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);

		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that Logs user in.
	 * @param ctx
	 * @returns action to persist auth state.
	 */
	@Action(Auth.Signin)
	signin(ctx: StateContext<AuthStateModel>, action: Auth.Signin): Observable<void> {
		this._log.info('signin action handler fired.', this);
		this._log.info(`Jwt token expires in: ${action.payload.accessToken.expires_in} seconds.`, this);
		this._log.info(`Jwt token expirey date`, this, add(new Date(), { seconds: action.payload.accessToken.expires_in }));
		const expires_at = getUnixTime(add(new Date(), { seconds: action.payload.accessToken.expires_in }));
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft.isAuthenticated = true;
				draft.access_token = action.payload.accessToken.access_token;
				draft.expires_at = expires_at;
				draft.userId = action.payload.userId;
			})
		);

		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler for setting current user id.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.SetCurrentUserId)
	setCurrentUserId(ctx: StateContext<AuthStateModel>, action: Auth.SetCurrentUserId): Observable<void> {
		this._log.info('setCurrentUserId action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that signs user out.
	 * @param ctx
	 * @returns action to persist auth state.
	 */
	@Action(Auth.Signout)
	signout(ctx: StateContext<AuthStateModel>): Observable<void> {
		this._log.info('signout action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft.isAuthenticated = false;
				draft.is2StepVerificationRequired = false;
				draft.is2StepVerificationSuccessful = false;
				draft.isRedeemRecoveryCodeSuccessful = false;
				draft.access_token = '';
				draft.expires_at = 0;
				draft.userId = '';
			})
		);
		this._log.debug('[signout]: Removing ACTIVE_UNTIL from local storage.');
		this._localStorageService.removeItem(ACTIVE_UNTIL);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Actions handler that updates username saved in local storage based on remember me option.
	 * @param ctx
	 */
	@Action(Auth.KeepOrRemoveRememberMeUsername)
	keepOrRemoveRememberMeUsername(ctx: StateContext<AuthStateModel>): Observable<void> {
		const rememberMe = ctx.getState().rememberMe;
		this._log.info('keepOrRemoveRememberMeUsername action handler fired. Remember me options is set to:', this, rememberMe);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft.username = rememberMe ? draft.username : '';
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that switches active panel.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.SwitchAuthType)
	switchAuthType(ctx: StateContext<AuthStateModel>, action: Auth.SwitchAuthType): Observable<void> {
		this._log.info('switchAuthType action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that updates state whether two step verification code has been successfully verified.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.Is2StepVerificationSuccessful)
	is2StepVerificationSuccessful(ctx: StateContext<AuthStateModel>, action: Auth.Is2StepVerificationSuccessful): Observable<void> {
		this._log.info('is2StepVerificationSuccessful action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler whether two step verification is required to sign user in.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.Is2StepVerificationSuccessful)
	is2StepVerificationRequired(ctx: StateContext<AuthStateModel>, action: Auth.Is2StepVerificationRequired): Observable<void> {
		this._log.info('is2StepVerificationRequired action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that updates state whether two step verification code has been successfully verified.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.IsRedeemRecoveryCodeSuccessful)
	isRedeemRecoveryCodeSuccessful(ctx: StateContext<AuthStateModel>, action: Auth.IsRedeemRecoveryCodeSuccessful): Observable<void> {
		this._log.info('isRedeemRecoveryCodeSuccessful action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Actions handler that updates state whether user's password reset request completed without errors.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.PasswordResetCompleted)
	passwordResetCompleted(ctx: StateContext<AuthStateModel>, action: Auth.PasswordResetCompleted): Observable<void> {
		this._log.info('passwordResetCompleted action handler fired.', this);
		ctx.setState(
			produce((draft: AuthStateModel) => {
				draft = { ...draft, ...action.payload };
				return draft;
			})
		);
		const auth = ctx.getState();
		return ctx.dispatch(new Auth.PersistSettings(auth));
	}

	/**
	 * Action handler that persists auth settings to local storage.
	 * @param ctx
	 * @param action
	 */
	@Action(Auth.PersistSettings)
	persistSettings(ctx: StateContext<AuthStateModel>, action: Auth.PersistSettings): void {
		this._log.info('persistSettings action handler fired.', this);
		this._localStorageService.setItem(AUTH_KEY, action.payload);
	}
}
