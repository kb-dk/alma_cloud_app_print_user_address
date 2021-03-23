import {Component} from '@angular/core';
import {AppService} from '../app.service';
import {CloudAppSettingsService, CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {ToastrService} from 'ngx-toastr';
import {MatDialog} from "@angular/material/dialog";
import {catchError, map, tap} from "rxjs/operators";
import {combineLatest, EMPTY} from "rxjs";

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent{
    errorMsg;
    saving = false;
    loading: boolean = true;
    settings = {myAddress:''};
    config = {user: {logo: ''}, partner: {addresses: []}};

    config$ = this.configService.get().pipe(
        map(config=> Object.keys(config).length === 0? this.config : config),
        tap(config => this.config = config),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    settings$ = this.settingsService.get().pipe(
        map(settings=> Object.keys(settings).length === 0? this.settings : settings),
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
        map(([config, settings]) => ({'config':config, 'settings':settings})),
        tap(r => console.log(r)),
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
    ) { }

    saveSettings = (toastMessage:string) =>{
        this.settingsService.set(this.settings).subscribe(
            response => {
                this.toastr.success(toastMessage, 'Settings updated', {timeOut:1000});
            },
            err => this.toastr.error(err.message, '', {timeOut:1000}),
            () => this.saving = false
        );
    };

    // Replace commas with line-break and bold the first line
    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>'+title+'</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };

    onSelectMyAddress = (event) => {
        this.settings.myAddress = this.config.partner.addresses[event.value];
        this.saveSettings('Your address is set.');
    };
}