import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecurityContainerRoutingModule } from './security-container-routing.module';
import { ChangePasswordContainerComponent } from './change-password-container/change-password-container.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { SecurityContainerComponent } from './security-container.component';
import { TwoFactorAuthenticationComponent } from './two-factor-authentication/two-factor-authentication.component';
import { TwoFactorAuthenticationCodesComponent } from './two-factor-authentication-codes/two-factor-authentication-codes.component';
import { TwoFactorAuthenticationSetupWizardComponent } from './two-factor-authentication-setup-wizard/two-factor-authentication-setup-wizard.component';
import { QRCodeModule } from 'angularx-qrcode';
import { SharedModule } from 'app/shared/shared.module';
import { NgxsModule } from '@ngxs/store';
import { AccountSecurityState } from './security-container.store.state';
import { TwoFactorAuthenticationState } from './two-factor-authentication/two-factor-authentication.store.state';

@NgModule({
	declarations: [
		ChangePasswordContainerComponent,
		ChangePasswordComponent,
		SecurityContainerComponent,
		TwoFactorAuthenticationComponent,
		TwoFactorAuthenticationCodesComponent,
		TwoFactorAuthenticationSetupWizardComponent
	],
	imports: [
		CommonModule,
		SecurityContainerRoutingModule,
		QRCodeModule,
		SharedModule,
		NgxsModule.forFeature([AccountSecurityState, TwoFactorAuthenticationState])
	]
})
export class SecurityContainerModule {}
