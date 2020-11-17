import {Component, OnInit} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {finalize} from 'rxjs/operators';

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent implements OnInit {

    config = {logo: ''};
    loading = false;

    constructor(private configService: CloudAppConfigService) {
    }

    ngOnInit() {
        this.loading = true;
        this.configService.get().subscribe({
            next: config => Object.assign(this.config, config),
            complete: () => this.loading = false
        });
    }

    get logoUrl() {
        return this.config.logo;
    }

    fileChangeEvent(files: File[]) {
        let file = files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.config.logo = reader.result.toString();
            this.save();
        };
        reader.onerror = error => console.log('Error reading image' + error);
    }

    save() {
        this.loading = true;
        this.configService.set(this.config).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: () => console.log('Configuration successfully saved'),
            error: e => console.log('Error saving configuration')
        })
    }

    clearLogo = () => {
        this.config = {logo: ''};
        this.save();
        console.log('Logo cleared');
    }

}
