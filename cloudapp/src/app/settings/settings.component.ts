import {Component} from '@angular/core';
import {AppService} from '../app.service';
import {CloudAppSettingsService, CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {ToastrService} from 'ngx-toastr';
import {MatDialog} from "@angular/material/dialog";
import {catchError, map, tap} from "rxjs/operators";
import {combineLatest, EMPTY, Observable} from "rxjs";
import {Config} from '../config/config';
import {Settings} from './settings';
import {AddressFormats} from "../config/address-format";

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
    settings: Settings = {myAddress: ''};
    config: Config = {user: {logo: ''}, partner: {addresses: []}, addressFormat: {addresses: {}, default: "1"}};

    config$: Observable<Config> = this.configService.get().pipe(
        map(config => this.fixOldOrEmptyConfigElements(config)),
        tap(config => this.config = config),
        tap(config => console.log("Config:", config)),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    fixOldOrEmptyConfigElements = (config) => {
        // Fix it if config is an empty object
        if (!Object.keys(config).length) {
            config = {user: {logo: ''}, partner: {addresses: []}, addressFormat: {addresses: {}, default: "1"}};
            config.addressFormat.addresses = this.addressFormats;
        }
        // Fix it if logo is directly in the config and not under user
        if (config.hasOwnProperty('logo')) {
            config.user = {};
            config.user.logo = config.logo;
            delete config.logo;
        }
        // Fix the config if there is no partner
        if (!config.hasOwnProperty('partner')) {
            config.partner = {}
        }
        // Fix the config if there is not addresses in partner
        if (!config.partner.hasOwnProperty('addresses')) {
            config.partner.addresses = []
        }
        // Fix the config if there is not addressFormat
        if (!config.hasOwnProperty('addressFormat')) {
            config.addressFormat = {addresses: {}, default: "1"};
            config.addressFormat.addresses = this.addressFormats;
        }
        return config;
    };


    settings$ = this.settingsService.get().pipe(
        map(settings => Object.keys(settings).length === 0 ? this.settings : settings),
        tap(settings => this.settings = settings),
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
            let set = Object.keys(setting).length === 0 ? this.settings : this.settings;
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
        public dialog: MatDialog
    ) {
    }

    saveSettings = (toastMessage: string) => {
        this.settingsService.set(this.settings).subscribe(
            response => {
                this.toastr.success(toastMessage, 'Settings updated', {timeOut: 1000});
            },
            err => this.toastr.error(err.message, '', {timeOut: 1000}),
            () => this.saving = false
        );
    };

    // Replace commas with line-break and bold the first line
    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>' + title + '</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };

    onSelectMyAddress = (event) => {
        this.settings.myAddress = this.config.partner.addresses[event.value];
        this.saveSettings('Your address is set.');
    };
}