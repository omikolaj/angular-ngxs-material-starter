import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AuthFacadeService } from '../auth-facade.service';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { OdmValidators } from 'app/core/form-validators/odm-validators';
import { AsyncValidatorsService } from 'app/core/form-validators/validators-async.service';
import { SignupUserModel } from 'app/core/auth/signup-user.model';
import { SigninUserModel } from 'app/core/auth/signin-user.model';
import { ROUTE_ANIMATIONS_ELEMENTS } from 'app/core/core.module';
import { ProblemDetails } from 'app/core/models/problem-details.model';
import { InternalServerErrorDetails } from 'app/core/models/internal-server-error-details.model';
import { LogService } from 'app/core/logger/log.service';
import { tap } from 'rxjs/operators';

/**
 * AuthContainer component
 */
@Component({
	selector: 'odm-auth-container',
	templateUrl: './auth-container.component.html',
	styleUrls: ['./auth-container.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthContainerComponent implements OnInit, OnDestroy {
	/**
	 * Route animations elements of auth container component.
	 */
	_routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

	/**
	 * Validation problem details$ of auth container component when form validations get passed angular but fail on the server.
	 */
	_problemDetails$: Observable<ProblemDetails>;

	/**
	 * Internal server error details$ of auth container component.
	 */
	_internalServerErrorDetails$: Observable<InternalServerErrorDetails>;

	/**
	 * Signin form of auth component.
	 */
	_signinForm: FormGroup;

	/**
	 * Signup form of auth component.
	 */
	_signupForm: FormGroup;

	/**
	 * Remember me option selected by the user.
	 */
	private _rememberMe$: Observable<boolean>;

	/**
	 * Subscription of auth container component.
	 */
	private _subscription = new Subscription();

	/**
	 * Creates an instance of auth container component.
	 * @param facade
	 * @param asyncValidators
	 * @param fb
	 */
	constructor(
		private facade: AuthFacadeService,
		private asyncValidators: AsyncValidatorsService,
		private fb: FormBuilder,
		private logger: LogService
	) {
		this._problemDetails$ = facade.problemDetails$;
		this._internalServerErrorDetails$ = facade.internalServerErrorDetails$;
		this._rememberMe$ = facade.rememberMe$;
	}

	/**
	 * NgOnInit life cycle.
	 */
	ngOnInit(): void {
		this._initForms();
		this._subscription = this._rememberMe$.pipe(tap((value) => this._signinForm.get('rememberMe').setValue(value))).subscribe();
	}

	/**
	 * NgOnDestroy life cycle.
	 */
	ngOnDestroy(): void {
		this._subscription.unsubscribe();
	}

	/**
	 * Event handler for when user changes remember me option.
	 * @param event
	 */
	_onRememberMeChanged(event: boolean): void {
		this.logger.info('onRememberMeChanged event handler fired.', this, event);
		this.facade.onRememberMeChanged(event);
	}

	/**
	 * Event handler for when user signs in.
	 * @param model
	 */
	_onSigninSubmitted(model: SigninUserModel): void {
		this.logger.info('onSigninSubmitted event handler fired.', this);
		this.facade.signinUser(model);
	}

	/**
	 * Event handler for when user signs in with google.
	 */
	_onSigninWithGoogleSubmitted(): void {
		this.logger.info('onSigninWithGoogleSubmitted event handler fired.', this);
		this.facade.signinUserWithGoogle();
	}

	/**
	 * Event handler for when user signs in with facebook.
	 */
	_onSigninWithFacebookSubmitted(): void {
		this.logger.info('onSigninWithFacebookSubmitted event handler fired.', this);
		this.facade.signinUserWithFacebook();
	}

	/**
	 * Event handler for when user signs up.
	 * @param model
	 */
	_onSignupSubmitted(model: SignupUserModel): void {
		this.logger.info('onSignupSubmitted event handler fired.', this);
		this.facade.signupUser(model);
	}

	/**
	 * Inits singin and signup forms.
	 */
	private _initForms(): void {
		this._signinForm = this._initSigninForm();
		this._signupForm = this._initSignupForm();
	}

	/**
	 * Creates FormGroup for signin form.
	 * @returns signin form
	 */
	private _initSigninForm(): FormGroup {
		return this.fb.group({
			email: this.fb.control('', {
				validators: [OdmValidators.required, OdmValidators.email],
				updateOn: 'blur'
			}),
			password: this.fb.control('', [OdmValidators.required]),
			rememberMe: this.fb.control(false)
		});
	}

	/**
	 * Creates FormGroup for signup form.
	 * @returns signup form
	 */
	private _initSignupForm(): FormGroup {
		return this.fb.group(
			{
				email: this.fb.control('', {
					validators: [OdmValidators.required, OdmValidators.email],
					asyncValidators: [this.asyncValidators.checkIfEmailIsUnique()],
					updateOn: 'blur'
				}),
				password: this.fb.control('', {
					validators: [
						OdmValidators.required,
						OdmValidators.minLength(8),
						OdmValidators.requireDigit,
						OdmValidators.requireLowercase,
						OdmValidators.requireUppercase,
						OdmValidators.requireNonAlphanumeric,
						OdmValidators.requireThreeUniqueCharacters
					],
					updateOn: 'change'
				}),
				confirmPassword: this.fb.control('')
			},
			{
				validators: OdmValidators.requireConfirmPassword,
				updateOn: 'change'
			}
		);
	}
}
