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
import {FixConfigService} from "../fix-config.service";

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
        map(config => this.fixConfigService.fixOldOrEmptyConfigElements(config)),
        tap(config => this.config = config),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    settings$ = this.settingsService.get().pipe(
        map(settings => Object.keys(settings).length === 0 ? this.settings : settings),
        tap(settings => this.settings = settings),
        tap(settings => settings.partnerPrintType === undefined ? this.settings.partnerPrintType = 'label' : true),
        tap(settings => settings.labelWidth === undefined ? this.settings.labelWidth = '10' : true),
        tap(settings => settings.labelHeight === undefined ? this.settings.labelHeight = '5.5' : true),
        tap(settings => settings.defaultTab === undefined ? this.settings.defaultTab = '0' : true),
        tap(settings => settings.logoInBottom === undefined ? this.settings.logoInBottom = false : true),
        tap(settings => settings.logoWidth === undefined ? this.settings.logoWidth = '3' : true),
        tap(settings => settings.addressTopMargin === undefined ? this.settings.addressTopMargin = '2' : true),
        tap(settings => settings.addressLeftMargin === undefined ? this.settings.addressLeftMargin = '0' : true),
        tap(settings => settings.addressRightMargin === undefined ? this.settings.addressRightMargin = '0' : true),
        tap(settings => settings.addressBottomMargin === undefined ? this.settings.addressBottomMargin = '0' : true),
        tap(settings => settings.addressDefaultFontSize === undefined ? this.settings.addressDefaultFontSize = 17 : true),
        tap(settings => settings.addressWidth === undefined ? this.settings.addressWidth = '9' : true),
        tap(settings => settings.textBeforeAddress === undefined ? this.settings.textBeforeAddress = '' : true),
        tap(settings => settings.languageDirection === undefined ? this.settings.languageDirection = 'ltr' : true),
        tap(settings => settings.paperSize === undefined ? this.settings.paperSize = '21.0X29.7' : true),
        tap(settings => settings.paperMarginTop === undefined ? this.settings.paperMarginTop = '1' : true),
        tap(settings => settings.paperMarginBottom === undefined ? this.settings.paperMarginBottom = '1' : true),
        tap(settings => settings.paperMarginLeft === undefined ? this.settings.paperMarginLeft = '1' : true),
        tap(settings => settings.paperMarginRight === undefined ? this.settings.paperMarginRight = '1' : true),
        tap(settings => settings.multiAddressPerPage === undefined ? this.settings.multiAddressPerPage = false : true),
        tap(settings => settings.repeatAddress === undefined ? this.settings.repeatAddress = false : true),
        tap(settings => settings.numAddressPerRow === undefined ? this.settings.numAddressPerRow = 3 : true),
        tap(settings => settings.numAddressPerColumn === undefined ? this.settings.numAddressPerColumn = 7 : true),
        tap(settings => settings.cellPaddingLeft === undefined ? this.settings.cellPaddingLeft = 0 : true),
        tap(settings => settings.cellPaddingRight === undefined ? this.settings.cellPaddingRight = 0 : true),
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
        private fixConfigService: FixConfigService,
        public dialog: MatDialog
    ) {
    }

    saveSettings = (toastMessage: string) => {
        this.settingsService.set(this.settings).subscribe(
            () => {
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