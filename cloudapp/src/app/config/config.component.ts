import {Component} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {catchError, map, tap} from 'rxjs/operators';
import {EMPTY, Observable} from "rxjs";
import {Config} from "./config";
import {ToastrService} from 'ngx-toastr';
import {AddressFormats} from "./address-format";

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent {

    showExample: boolean = true;
    addressFormats = AddressFormats;
    loading: boolean = true;
    newSenderAddress: string = '';
    config: Config = {user: {logo: ''}, partner: {addresses: []}, addressFormat: {addresses: {}, default: "1"}};

    config$: Observable<Config> = this.configService.get()
        .pipe(

            // tap(config => this.saveConfig('')),

            map(config => this.fixOldOrEmptyConfigElements(config)),
            tap(config => this.config = config),
            tap(config => console.log("Config:", config)),
            tap(() => this.loading = false),
            catchError(error => {
                console.log('Error getting configuration:', error);
                return EMPTY;
            })
        );

    constructor(private configService: CloudAppConfigService, private toastr: ToastrService) {
    }

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

    onLogoChanged = (images: File[]) => {
        let logo = images[0];
        let logoReader = new FileReader();
        logoReader.readAsDataURL(logo);
        logoReader.onload = () => {
            this.config.user.logo = logoReader.result.toString();
            this.saveConfig('Your logo is set.');
        };
        logoReader.onerror = error => console.log('Error reading image' + error);
    };

    saveConfig = (toastMessage) => {
        // let config = {user: {logo: ''}, partner: {addresses: []}};

        this.configService.set(this.config).pipe(
        ).subscribe(
            () => this.toastr.success(toastMessage, 'Config updated', {timeOut: 2000}),
            error => console.log('Error saving configuration:', error)
        )
    };

    onSelectMyAddressFormat = (event) => {
        this.config.addressFormat.default = event.value;
        this.saveConfig('Your address format is set.');
    };

    clearLogo = () => {
        this.config.user.logo = '';
        this.saveConfig('Your logo is cleared.');
    };

    onAddSender = () => {
        if (this.newSenderAddress) {
            this.config.partner.addresses.push(this.newSenderAddress);
            this.newSenderAddress = '';
            this.saveConfig('The sender address is added.');
        }
    };

    onRemoveAddress = (i) => {
        this.config.partner.addresses.splice(i, 1);
        this.saveConfig('The address is removed.');
    };

    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>' + title + '</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };
}

