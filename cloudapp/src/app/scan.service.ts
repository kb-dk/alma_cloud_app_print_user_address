import {Injectable, ElementRef} from '@angular/core';
import {of} from "rxjs";
import {concatMap} from "rxjs/operators";
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    CloudAppSettingsService,
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserService} from "./user.service";
import {PartnerService} from "./partner.service";
import {FixConfigService} from "./fix-config.service";

@Injectable({
    providedIn: 'root'
})


export class ScanService {

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private settingsService: CloudAppSettingsService,
                private eventsService: CloudAppEventsService,
                private userService: UserService,
                private partnerService: PartnerService,
                private scanService: ScanService,
                private fixConfigService: FixConfigService
    ) {
    }

    scan = (barcode) => {
        if (barcode) {
            let x = this.restService.call(`/items?item_barcode=${barcode}`);
            let y = x.pipe(
                concatMap(item => {
                        return this.getItem(item.link)
                }));

            y.subscribe(
                (data) => console.log('data:',data),
                error => console.log('Error saving configuration:', error)
            )
        }

        return of('hi') ;
    };

    getItem(link: string) {
        return this.restService.call({
            url: link,
            queryParams: { view: 'label'}
        });
    }
}