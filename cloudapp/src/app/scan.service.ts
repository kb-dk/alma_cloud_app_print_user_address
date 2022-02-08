import {Injectable} from '@angular/core';
import {throwError} from "rxjs";
import {catchError, concatMap, map, tap} from "rxjs/operators";
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    CloudAppSettingsService,
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserService} from "./user.service";
import {PartnerService} from "./partner.service";
import {FixConfigService} from "./fix-config.service";
import {AddressFormats} from "./config/address-format";
import {ConvertService} from "./convert.service";

@Injectable({
    providedIn: 'root'
})


export class ScanService {

    senders_address: string = '';
    addressFormat = AddressFormats['1'];
    showCountry = true;

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private settingsService: CloudAppSettingsService,
                private eventsService: CloudAppEventsService,
                private userService: UserService,
                private partnerService: PartnerService,
                private scanService: ScanService,
                private fixConfigService: FixConfigService,
                private convertService: ConvertService,
    ) {
    }

    scan = (barcode) => {

        this.configService.get().pipe(
            map(config => this.fixConfigService.fixOldOrEmptyConfigElements(config)),
            tap(config => this.addressFormat = config.addressFormat.addresses[config.addressFormat.default]),
            tap(config => this.showCountry = config.addressFormat.showCountry),
            catchError(err => this.handleError(err))
        );


        return this.restService.call(`/almaws/v1/items?item_barcode=${barcode}`).pipe(
            concatMap(item => this.getRequests(item.link)),
            map(item => item.user_request[0].resource_sharing.partner.link),
            concatMap(partner_link => this.restService.call(partner_link)),
            tap(partner => console.log(partner)),
            map(partner => this.convertService.partnerFromAlmaPartner(this.addressFormat, this.showCountry, partner, this.senders_address)),
            tap(partner => partner.checked = true),
        )
    };

    getRequests = (link) => this.restService.call(`${link}/requests?status=history`);

    getResourceSharingRequestFromRequest = id => this.restService.call(`/resource-sharing-requests/${id}`);

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };

}