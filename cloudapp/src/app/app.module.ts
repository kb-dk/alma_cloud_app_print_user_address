import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialModule, CloudAppTranslateModule } from '@exlibris/exl-cloudapp-angular-lib';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { MainComponent } from './main/main.component';
import {UserService} from './user.service';
import {ConfigComponent} from './config/config.component';
import {SettingsComponent} from './settings/settings.component';
import { PartnerComponent } from './main/partner/partner.component';
import {DefaultsService} from "./main/shared/defaults.service";
import {HtmlService} from "./main/shared/html.service";

export function getToastrModule() {
  return ToastrModule.forRoot({
    positionClass: 'toast-top-right',
  });
}

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ConfigComponent,
    SettingsComponent,
    PartnerComponent,
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    getToastrModule(),
    CloudAppTranslateModule.forRoot()
  ],
  providers: [UserService, DefaultsService, HtmlService],
  bootstrap: [AppComponent]
})
export class AppModule { }
