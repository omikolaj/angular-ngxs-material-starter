import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf, ErrorHandler } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../environments/environment';

import { AuthGuardService } from './auth/auth-guard.service';
import { TitleService } from './title/title.service';
import { ROUTE_ANIMATIONS_ELEMENTS, routeAnimations } from './animations/route.animations';
import { AnimationsService } from './animations/animations.service';
import { AppErrorHandler } from './error-handler/app-error-handler.service';

import { LocalStorageService } from './local-storage/local-storage.service';
import { HttpErrorInterceptor } from './http-interceptors/http-error.interceptor';

import { NotificationService } from './notifications/notification.service';
import { MatButtonModule } from '@angular/material/button';
import {
	faCog,
	faBars,
	faRocket,
	faPowerOff,
	faUserCircle,
	faPlayCircle,
	faTachometerAlt,
	faExclamationTriangle,
	faCheck,
	faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faMediumM, faTwitter, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { NgxsModule, NGXS_PLUGINS } from '@ngxs/store';
import { SettingsState } from './settings/settings.store.state';

import { AuthState } from './auth/auth.store.state';

import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsRouterPluginModule, RouterStateSerializer } from '@ngxs/router-plugin';
import { CustomSerializer } from './router/custom-serializer';
import { BACKEND_API_URL } from './api-url-injection-token';
import { ServerErrorService } from './error-handler/server-error.service';
import { HttpStatusInterceptor } from './http-interceptors/http-status.interceptor';
import { HttpAccessTokenInterceptor } from './http-interceptors/http-access-token.interceptor';

import {
	rightLeftFadeInAnimation,
	leftRightFadeInAnimation,
	upDownFadeInAnimation,
	fadeInAnimation,
	downUpFadeInAnimation
} from 'app/core/animations/element.animations';
import { LogService } from './logger/log.service';
import { LocalStorage } from './local-storage/local-storage';

export {
	TitleService,
	routeAnimations,
	LocalStorageService,
	ROUTE_ANIMATIONS_ELEMENTS,
	rightLeftFadeInAnimation,
	leftRightFadeInAnimation,
	upDownFadeInAnimation,
	downUpFadeInAnimation,
	fadeInAnimation,
	AnimationsService,
	AuthGuardService,
	NotificationService
};

/**
 * Returns custom translations file.
 * @param http
 * @returns loader factory.
 */
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
	return new TranslateHttpLoader(http, `${environment.i18nPrefix}/assets/i18n/`, '.json');
}

/**
 * Core module.
 */
@NgModule({
	imports: [
		// angular
		CommonModule,
		HttpClientModule,
		FormsModule,

		// material
		MatSidenavModule,
		MatToolbarModule,
		MatListModule,
		MatMenuModule,
		MatIconModule,
		MatSelectModule,
		MatTooltipModule,
		MatSnackBarModule,
		MatButtonModule,

		// ngxs
		NgxsModule.forRoot([SettingsState, AuthState], {
			developmentMode: !environment.production,
			selectorOptions: {
				suppressErrors: false,
				injectContainerState: true
			},
			compatibility: {
				strictContentSecurityPolicy: true
			}
		}),

		NgxsRouterPluginModule.forRoot(),

		NgxsLoggerPluginModule.forRoot({
			collapsed: true,
			disabled: environment.production
		}),

		// 3rd party
		FontAwesomeModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		})
	],
	providers: [
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		{ provide: LocalStorage, useValue: window.localStorage },
		{ provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: HttpStatusInterceptor, multi: true, deps: [LogService, ServerErrorService] },
		{ provide: HTTP_INTERCEPTORS, useClass: HttpAccessTokenInterceptor, multi: true },
		{ provide: ErrorHandler, useClass: AppErrorHandler },
		{ provide: RouterStateSerializer, useClass: CustomSerializer },
		{ provide: NGXS_PLUGINS, useClass: LocalStorageService, multi: true },
		{ provide: BACKEND_API_URL, useValue: environment.backend.apiUrl }
	],
	exports: [
		// angular
		FormsModule,

		// material
		MatSidenavModule,
		MatToolbarModule,
		MatListModule,
		MatMenuModule,
		MatIconModule,
		MatSelectModule,
		MatTooltipModule,
		MatSnackBarModule,
		MatButtonModule,

		// 3rd party
		FontAwesomeModule,
		TranslateModule
	]
})
export class CoreModule {
	/**
	 * Creates an instance of core module.
	 * @param parentModule
	 * @param faIconLibrary
	 */
	constructor(
		@Optional()
		@SkipSelf()
		parentModule: CoreModule,
		faIconLibrary: FaIconLibrary
	) {
		if (parentModule) {
			throw new Error('CoreModule is already loaded. Import only in AppModule');
		}
		faIconLibrary.addIcons(
			faCog,
			faBars,
			faRocket,
			faPowerOff,
			faUserCircle,
			faTachometerAlt,
			faPlayCircle,
			faGithub,
			faMediumM,
			faTwitter,
			faInstagram,
			faYoutube,
			faCheck,
			faExclamationTriangle,
			faPaperPlane
		);
	}
}
