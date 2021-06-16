import {Injectable, ElementRef} from '@angular/core';
import {of} from "rxjs";
import {concatMap, map, tap} from "rxjs/operators";
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

    requests_link = '';

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
            let x = this.restService.call(`/almaws/v1/items?item_barcode=${barcode}`);
            let y = x.pipe(
                tap(item => console.log('item:',item)),
                tap(item => this.requests_link = item.link),
                concatMap(item => this.getRequests(this.requests_link )),
                tap(item => console.log('requests:',item)),
                map(item => item.user_request[0].request_id),
                tap(request => console.log(`${this.requests_link}`)),
                concatMap(request => this.getRequest(request)),
            //    /almaws/v1/users/88007088/requests/24518294710005763

            );

            y.subscribe(
                (data) => console.log('data:',data),
                error => console.log('Error getting data from API:', error)
            )
        }

        return of('hi') ;
    };

    getRequests = (link) => this.restService.call(`${link}/requests`);
    getRequest = (request) => this.restService.call(`${this.requests_link}/requests/${request}`);
    // getRequest = (id) =>

    getItem(link: string) {
        return this.restService.call({
            url: link,
            queryParams: { view: 'label'}
        });
    }
}