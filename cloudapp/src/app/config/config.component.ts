import {Component} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {catchError, map, tap} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, EMPTY} from "rxjs";

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent{

    loading:boolean = true;
    config = {user:{logo:''}, partner:{addresses:[]}};

    logoFromConfig$ = this.configService.get().pipe(
        map(config => config.logo),
        tap(() => this.loading = false),
        catchError(error => {
            console.log('Error getting configuration:', error);
            return EMPTY;
        })
    );

    private logoChangedSubject = new BehaviorSubject<string>('logoHasNotChanged');
    logoChangedAction$ = this.logoChangedSubject.asObservable();

    logoUrl$ = combineLatest([
        this.logoChangedAction$,
        this.logoFromConfig$
    ]).pipe(
        map(([newLogo, configLogo]) => newLogo !== 'logoHasNotChanged'? newLogo : configLogo),
        catchError(error => {
            console.log('Error getting logo:', error);
            return EMPTY;
        }),
    );

    constructor(private configService: CloudAppConfigService) {
    }

    onLogoChanged = (images: File[]) => {
        let logo = images[0];
        let logoReader = new FileReader();
        logoReader.readAsDataURL(logo);
        logoReader.onload = () => {
            let logo = logoReader.result.toString();
            this.logoChangedSubject.next(logo);
            this.config.user.logo = logo;
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
        this.logoChangedSubject.next('');
        this.config.user.logo = '';
        this.saveConfig();
        console.log('Logo cleared');
    };

    addSender = () => {

    };
}
