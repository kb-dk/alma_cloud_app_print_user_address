import {Component} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {catchError, map, tap} from 'rxjs/operators';
import {EMPTY, Observable} from "rxjs";
import {Config} from "./config";
import {ToastrService} from 'ngx-toastr';

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent {

    showExample: boolean = true;
    example1 = [
        ['recipient'],
        ['line1', 'line2', 'line3', 'line4', 'line5'],
        ['postal_code', 'city', 'state_province'],
        ['country']
    ];
    example2 = [
        ['recipient'],
        ['line1', 'line2', 'line3', 'line4', 'line5'],
        ['city', 'state_province', 'postal_code'],
        ['country']
    ];
    loading: boolean = true;
    newSenderAddress: string = '';
    config: Config = {
        user:
            {
                logo: ''
            },
        partner: {
            addresses: []
        },
        addressFormat: {
            addresses: {
                '1': [
                    ['recipient'],
                    ['line1', 'line2', 'line3', 'line4', 'line5'],
                    ['postal_code', 'city', 'state_province'],
                    ['country']
                ],
                '2': [
                    ['recipient'],
                    ['line1', 'line2', 'line3', 'line4', 'line5'],
                    ['city', 'state_province', 'postal_code'],
                    ['country']
                ]
            },
            default: "1"
        }
    };

    config$:Observable<Config> = this.configService.get()
        .pipe(
        // map((config:Config) => {
        //     // Fix the old config format
        //     if (config.hasOwnProperty('logo')){
        //         let newConfig = this.config;
        //         newConfig.user.logo = config.logo;
        //         config = newConfig;
        //     }
        //     return config;
        // }),
        // map(config=> Object.keys(config).length === 0? this.config : config),

            // tap(config => this.saveConfig()),
        tap(config => config.partner.hasOwnProperty('addresses')?config:config.partner.addresses = []),
        tap(config => {
            if (!config.addressFormat.hasOwnProperty('addresses')){
                config.addressFormat = {};
                config.addressFormat.addresses = {};
                config.addressFormat.addresses['1'] = this.example1;
                config.addressFormat.addresses['2'] = this.example2;
                config.addressFormat.default = '1';
                console.log(config);
            }
        }),
        tap(config => this.config = config),
        tap(config => console.log("Config:",config)),
        tap(() => this.loading = false),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    constructor(private configService: CloudAppConfigService, private toastr: ToastrService) {
    }

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
        // let config = {
        //         user:
        //             {
        //                 logo: ''
        //             },
        //         partner: {
        //             addresses: []
        //         },
        //         addressFormat: {
        //             addresses: {
        //                 '1': [
        //                     ['recipient'],
        //                     ['line1', 'line2', 'line3', 'line4', 'line5'],
        //                     ['postal_code', 'city', 'state_province'],
        //                     ['country']
        //                 ],
        //                 '2': [
        //                     ['recipient'],
        //                     ['line1', 'line2', 'line3', 'line4', 'line5'],
        //                     ['city', 'state_province', 'postal_code'],
        //                     ['country']
        //                 ]
        //             },
        //             default: "1"
        //         }
        //     };

        this.configService.set(this.config).pipe(
        ).subscribe(
            () => this.toastr.success(toastMessage, 'Config updated', {timeOut:2000}),
            error => console.log('Error saving configuration:', error)
        )
    };

    onSelectMyAddressFormat = (event) => {
        console.log(event);
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
        string = '<strong>'+title+'</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };
}

