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
        tap(settings => settings.addressWidth === undefined ? this.settings.addressWidth = '9' : true),
        tap(settings => settings.languageDirection === undefined ? this.settings.languageDirection = 'ltr' : true),
        tap(settings => settings.paperSize === undefined ? this.settings.paperSize = '21.0X29.7' : true),
        tap(settings => settings.paperMargin === undefined ? this.settings.paperMargin = '2' : true),
        tap(settings => settings.multiAddressPerPage === undefined ? this.settings.multiAddressPerPage = false : true),
        tap(settings => settings.repeatAddress === undefined ? this.settings.repeatAddress = false : true),
        tap(settings => settings.numAddressPerRow === undefined ? this.settings.numAddressPerRow = 3 : true),
        tap(settings => settings.numAddressPerColumn === undefined ? this.settings.numAddressPerColumn = 7 : true),

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

    onSelectDefaultTab = (event) => {
        this.settings.defaultTab = event.value;
        this.saveSettings('Default tab is set.');
    };

    onSelectMyAddress = (event) => {
        this.settings.myAddress = this.config.partner.addresses[event.value];
        this.saveSettings('Address is set.');
    };

    onPartnerPrintTypeSelected = (event) => {
        this.settings.partnerPrintType = event.value;
        this.saveSettings('Print type is set.');
    };

    onPartnerLabelWidthChanged = () => {
        this.saveSettings('Label width is set.');
    };

    onPartnerLabelHeightChanged = () => {
        this.saveSettings('Label height is set.');
    };

    onMoveLogo = (event) => {
        this.settings.logoInBottom = event.checked;
        this.saveSettings('Logo position is set.');
    };

    onLogoWidthChanged = () => {
        this.saveSettings('Logo width is set.');
    };

    onLanguageDirection = () => {
        this.saveSettings('Language direction is set.');
    };

    onPaperSizeChanged = () => {
        this.saveSettings('Paper size is set.');
    };

    onPaperMarginChanged = () => {
        this.saveSettings('Paper margin is set.');
    };

    onSelectMultipleAddressesPerPage = () => {
        this.saveSettings('Choice of multiple addresses per page is set.');
    };

    onNumAddressPerRowChanged() {
        this.saveSettings('Number of addresses per row is set.');
    }

    onNumAddressPerColumnChanged() {
        this.saveSettings('Number of addresses per column is set.');
    }

    onRepeatAddress() {
        this.saveSettings('Choice of repeat address is set.');
    }

    onAddressTopMarginChanged() {
        this.saveSettings("Address's top margin is set.");
    }

    onAddressWidthChanged() {
        this.saveSettings("Address's width is set.");
    }
}