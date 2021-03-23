import {Component} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {catchError, map, tap} from 'rxjs/operators';
import {EMPTY} from "rxjs";
import {Config} from "./config";
import {User} from "../user";


@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent {

    loading: boolean = true;
    newSenderAddress: string = '';
    config: Config = {user: {logo: ''}, partner: {addresses: []}};

    config$ = this.configService.get().pipe(
        map(config=> Object.keys(config).length === 0? this.config : config),
        tap(config => this.config = config),
        tap(() => this.loading = false),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    constructor(private configService: CloudAppConfigService) {
    }

    onLogoChanged = (images: File[]) => {
        let logo = images[0];
        let logoReader = new FileReader();
        logoReader.readAsDataURL(logo);
        logoReader.onload = () => {
            this.config.user.logo = logoReader.result.toString();
            this.saveConfig();
        };
        logoReader.onerror = error => console.log('Error reading image' + error);
    };

    saveConfig = () => {
        this.configService.set(this.config).pipe(
        ).subscribe(
            () => console.log('Configuration successfully saved'),
            error => console.log('Error saving configuration:', error)
        )
    };

    clearLogo = () => {
        this.config.user.logo = '';
        this.saveConfig();
    };

    onAddSender = () => {
        if (this.newSenderAddress) {
            this.config.partner.addresses.push(this.newSenderAddress);
            this.newSenderAddress = '';
            this.saveConfig();
        }
    };

    onRemoveAddress = (i) => {
        this.config.partner.addresses.splice(i, 1);
        this.saveConfig();
    };

    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>'+title+'</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };
}

