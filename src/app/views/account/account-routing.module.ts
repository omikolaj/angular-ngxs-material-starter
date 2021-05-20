import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { AuthGuardService } from 'app/core/core.module';

const routes: Routes = [
	{
		path: '',
		component: AccountComponent,
		canActivate: [AuthGuardService],
		data: { title: 'odm.account' },
		children: [
			{
				path: 'security',
				loadChildren: () => import('./security-container/security-container.module').then((m) => m.SecurityContainerModule)
			}
			// {
			// 	path: 'general',
			// 	component: GeneralContainerComponent,
			// 	data: { title: 'odm.account.general' }
			// }
		]
	}
];

/**
 * User account routing module.
 */
@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AccountRoutingModule {}
