import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActionCompletion } from '@ngxs/store';
import { leftRightFadeInAnimation } from 'app/core/core.module';
import { OdmValidators } from 'app/core/form-validators/odm-validators';
import { ActiveAuthType } from 'app/core/models/auth/active-auth-type.model';
import { AuthTypeRouteUrl } from 'app/core/models/auth/auth-type-route-url.model';
import { SigninUser } from 'app/core/models/auth/signin-user.model';
import { InternalServerErrorDetails } from 'app/core/models/internal-server-error-details.model';
import { ProblemDetails } from 'app/core/models/problem-details.model';
import { MinScreenSizeQuery } from 'app/shared/screen-size-queries';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthSandboxService } from '../auth-sandbox.service';

/**
 * Sign in container component.
 */
@Component({
	selector: 'odm-sign-in-container',
	templateUrl: './sign-in-container.component.html',
	styleUrls: ['./sign-in-container.component.scss'],
	animations: [leftRightFadeInAnimation],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInContainerComponent implements OnInit, OnDestroy {
	/**
	 * Emitted when server responds with 40X error.
	 */
	_problemDetails$: Observable<ProblemDetails>;

	/**
	 * Emitted when server responds with 50X error.
	 */
	_internalServerErrorDetails$: Observable<InternalServerErrorDetails>;

	/**
	 * Signin form of auth component.
	 */
	_signinForm: UntypedFormGroup;

	/**
	 * Whether specified screen width was matched.
	 */
	_breakpointStateScreenMatcher$: Observable<BreakpointState>;

	/**
	 * Whether to display sign-in or sign-up component.
	 */
	_activeAuthType$: Observable<string>;

	/**
	 * Remember me option selected by the user.
	 */
	_rememberMe$: Observable<boolean>;

	/**
	 * Saved username value if remember me was set to true, else empty string.
	 */
	_username$: Observable<string>;

	/**
	 * Whether user is in the process of signing in.
	 */
	_isSigningInUserInProgress$: Observable<boolean>;

	/**
	 * Whether Auth.Signin action has been dispatched and completed.
	 */
	private _signInActionCompleted$: Observable<ActionCompletion<any, Error>>;

	/**
	 * Rxjs subscriptions for this component.
	 */
	private readonly _subscription = new Subscription();

	/**
	 * Creates an instance of sign in container component.
	 * @param _sb
	 * @param _route
	 * @param breakpointObserver
	 */
	constructor(breakpointObserver: BreakpointObserver, private _sb: AuthSandboxService, private _route: ActivatedRoute) {
		this._problemDetails$ = _sb.problemDetails$;
		this._internalServerErrorDetails$ = _sb.internalServerErrorDetails$;
		this._rememberMe$ = _sb.rememberMe$;
		this._username$ = _sb.username$;
		this._breakpointStateScreenMatcher$ = breakpointObserver.observe([MinScreenSizeQuery.md]);
		this._activeAuthType$ = _sb.activeAuthType$;
		this._isSigningInUserInProgress$ = _sb.isSigningInUserInProgress$;
		this._signInActionCompleted$ = _sb.signInActionCompleted$;
	}

	/**
	 * NgOnInit life cycle.
	 */
	ngOnInit(): void {
		this._sb.log.trace('Initialized.', this);
		this._initForm();

		this._subscription.add(this._listenIfUserSignedIn$().subscribe());
	}

	/**
	 * NgOnDestroy life cycle.
	 */
	ngOnDestroy(): void {
		this._sb.log.trace('Destroyed.', this);
		this._subscription.unsubscribe();
	}

	/**
	 * Event handler for when user clicks forgot password.
	 */
	_onForgotPasswordClicked(): void {
		this._sb.log.trace('_onForgotPasswordClicked fired.', this);
		this._sb.updateActiveAuthType({ activeAuthType: 'forgot-password-active' });
		void this._sb.router.navigate(['forgot-password'], { relativeTo: this._route.parent });
	}

	/**
	 * Event handler for when user signs in.
	 * @param model
	 */
	_onSigninSubmitted(model: SigninUser): void {
		this._sb.log.trace('_onSigninSubmitted event handler fired.', this);
		if (this._signinForm.get('email').hasError('serverError')) {
			// clear old errors
			this._signinForm.get('email').setErrors(null);
		}

		if (model.email !== '' && model.password !== '') {
			this._sb.signinUser(model);
		}
	}

	/**
	 * Event handler for when user changes remember me option.
	 * @param event
	 */
	_onRememberMeChanged(event: boolean): void {
		this._sb.log.trace('_onRememberMeChanged event handler fired.', this, event);
		this._sb.changeRememberMeState(event);
	}

	/**
	 * Event handler for when user clicks sign up button.
	 * @param event
	 */
	_onSwitchToSignupClicked(event: ActiveAuthType): void {
		this._sb.log.trace('_onSwitchToSignupClicked event handler fired', this, event);
		const activeAuthType = { activeAuthType: event };
		const routeUrl: AuthTypeRouteUrl = event === 'sign-in-active' ? 'sign-in' : 'sign-up';
		this._sb.updateActiveAuthType(activeAuthType);
		setTimeout(() => {
			void this._sb.router.navigate([routeUrl], { relativeTo: this._route.parent });
		}, 300);
	}

	/**
	 * Listens if user has signed in.
	 * @returns if user signed in$
	 */
	private _listenIfUserSignedIn$(): Observable<ActionCompletion<any, Error>> {
		return this._signInActionCompleted$.pipe(tap(() => void this._sb.router.navigate(['account'])));
	}

	/**
	 * Inits singin form.
	 */
	private _initForm(): void {
		this._signinForm = this._initSigninForm();
	}

	/**
	 * Creates FormGroup for signin form.
	 * @returns signin form
	 */
	private _initSigninForm(): UntypedFormGroup {
		return this._sb.fb.group({
			email: this._sb.fb.control('', {
				validators: [OdmValidators.required, OdmValidators.email],
				updateOn: 'blur'
			}),
			password: this._sb.fb.control('', [OdmValidators.required]),
			rememberMe: this._sb.fb.control(false)
		});
	}
}
