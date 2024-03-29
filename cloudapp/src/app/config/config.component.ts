import {Component} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {catchError, map, tap} from 'rxjs/operators';
import {EMPTY, Observable} from "rxjs";
import {Config} from "./config";
import {emptyConfig} from "./emptyConfig";
import {ToastrService} from 'ngx-toastr';
import {ToolboxService} from "../shared/toolbox.service";

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent {

    loading: boolean = true;
    newSenderAddress: string = '';
    config: Config = emptyConfig;

    config$: Observable<Config> = this.configService.get()
        .pipe(
            map(config => this.toolboxService.fixOldOrEmptyConfigElements(config)),
            tap(config => this.config = Object.assign(this.config, config)),
            tap(() => this.loading = false),
            catchError(error => {
                console.log('Error getting configuration:', error);
                return EMPTY;
            })
        );

    constructor(private configService: CloudAppConfigService,
                public toolboxService: ToolboxService,
                private toastr: ToastrService) {
    }

    onLogoChanged = (event: Event) => {
        let files: FileList = (<HTMLInputElement>event.target).files;
        if (files && this.isFileImage(files[0])) {
            this.loadAndSaveLogo(files[0]);
        } else {
            this.toastr.error('The selected file must be an image.', 'Please select an image', {timeOut: 2000})
        }
    };

    isFileImage = (file) => {
        return file && file['type'].split('/')[0] === 'image';
    }

    saveConfig = (toastMessage) => {
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

    onSelectShowCountry = (event) => {
        this.config.addressFormat.showCountry = event.checked;
        this.saveConfig('Your address format is set.');
    };

    onSelectShowRecipient = (event) => {
        this.config.addressFormat.showRecipient = event.checked;
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

    private loadAndSaveLogo = (logo: File): void => {
        let logoReader = new FileReader();
        logoReader.readAsDataURL(logo);
        logoReader.onload = () => {
            this.config.user.logo = logoReader.result.toString();
            this.saveConfig('Your logo is set.');
        };
        logoReader.onerror = error => console.log('Error reading image' + error);
    }
}

