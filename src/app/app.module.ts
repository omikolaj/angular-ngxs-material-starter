import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CoreModule } from '../app/core/core.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';

/**
 * App module.
 */
@NgModule({
	imports: [
		// angular
		BrowserAnimationsModule,
		BrowserModule,

		// core
		CoreModule,

		// app
		AppRoutingModule
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent]
})
export class AppModule {}
