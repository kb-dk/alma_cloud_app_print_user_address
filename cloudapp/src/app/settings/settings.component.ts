import {Component} from '@angular/core';
import {AppService} from '../app.service';
import {CloudAppSettingsService, CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {ToastrService} from 'ngx-toastr';
import {MatDialog} from "@angular/material/dialog";
import {catchError, map, tap} from "rxjs/operators";
import {combineLatest, EMPTY, Observable} from "rxjs";
import {Config} from '../config/config';
import {emptyConfig} from "../config/emptyConfig";
import {emptySettings} from "./emptySettings";
import {Settings} from './settings';
import {AddressFormats} from "../config/address-format";
import {ToolboxService} from "../shared/toolbox.service";

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
    errorMsg;
    addressFormats = AddressFormats;
    saving = false;
    loading: boolean = true;
    settings: Settings = emptySettings;
    config: Config = emptyConfig;

    config$: Observable<Config> = this.configService.get().pipe(
        map(config => this.toolboxService.fixOldOrEmptyConfigElements(config)),
        tap(config => this.config = Object.assign(this.config, config)),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    settings$ = this.settingsService.get().pipe(
        map(settings => Object.keys(settings).length === 0 ? this.settings : settings),
        tap(settings => this.settings = Object.assign(this.settings, settings)),
        tap(() => this.settings = Object.assign(this.settings, this.toolboxService.fixSettings(this.settings, this.config))),
        catchError(error => {
            console.log('Error getting settings:', error);
            return EMPTY;
        })
    );

    configAndSettings$ = combineLatest([
        this.config$,
        this.settings$,
    ]).pipe(
        map(([config, setting]) => {
            let conf = Object.keys(config).length === 0 ? this.config : config;
            let set = Object.keys(setting).length === 0 ? this.settings : setting;
            return {'config': conf, 'settings': set};
        }),
        tap(() => this.loading = false),
        catchError(error => {
            this.errorMsg = error.message;
            return EMPTY;
        }),
    );

    constructor(
        private appService: AppService,
        private settingsService: CloudAppSettingsService,
        private configService: CloudAppConfigService,
        private toastr: ToastrService,
        public toolboxService: ToolboxService,
        public dialog: MatDialog
    ) {}

    saveSettings = (toastMessage: string) => {
        this.settingsService.set(this.settings).subscribe(
            () => {
                this.toastr.success(toastMessage, 'Settings updated', {timeOut: 1000});
            },
            err => this.toastr.error(err.message, '', {timeOut: 1000}),
            () => this.saving = false
        );
    };

    onSelectDefaultTab = (event, message) => {
        this.settings.defaultTab = event.value;
        this.saveSettings(message);
    };

    onSelectMyAddress = (event, message) => {
        this.settings.myAddress = this.config.partner.addresses[event.value];
        this.saveSettings(message);
    };

    onPartnerPrintTypeSelected = (event, message) => {
        this.settings.partnerPrintType = event.value;
        this.saveSettings(message);
    };
}