import {Injectable} from '@angular/core';
import {Address} from "./address";
import {AddressFormats} from "./config/address-format";
import {FixConfigService} from "./fix-config.service";
import {
    CloudAppRestService,
    Entity,
    EntityType,
    CloudAppConfigService,
} from "@exlibris/exl-cloudapp-angular-lib";
import {of, forkJoin, iif, throwError} from "rxjs";
import {catchError, map, switchMap} from "rxjs/operators";
import {Config} from "./config/config";


@Injectable({
    providedIn: 'root'
})

export class UserService {

    addressFormat = AddressFormats['1'];
    // To get the user address from the page entities
    // there is the need for two more API call (There might be other ways)
    // get the requests from the link string in the entity object (if there is user info in it)
    // then get the user info from the user_primary_id or user_id or primary_id field and extract the address from the response
    users$ = (entities: Entity[]) => {

        this.configService.get().subscribe(
            (config: Config) => {
                config = this.fixConfigService.fixOldOrEmptyConfigElements(config);
                this.addressFormat = config.addressFormat.addresses[config.addressFormat.default];
            },
            err => console.error(err.message));

        let calls = entities.filter(entity => [EntityType.LOAN, EntityType.USER, EntityType.REQUEST, EntityType.BORROWING_REQUEST].includes(entity.type))
            .map(entity => {
                switch (entity.type) {
                    case EntityType.LOAN:
                        return this.userFromLoan(entity.link);
                    case EntityType.REQUEST:
                        return this.userFromRequest(entity.link);
                    case EntityType.USER:
                        return this.getRequestFromAlma(entity.link);
                    case EntityType.BORROWING_REQUEST:
                        return this.getRequesterFromAlma(entity.link);
                }
            });
        return (calls.length === 0) ?
            of([]) :
            forkJoin(calls).pipe(
                catchError(err => this.handleError(err)),
                map(users => users.map((user, index) => this.userFromAlmaUser(user, index))),
            );
    };

    private getRequesterFromAlma = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(request => iif(() => request.requester !== null,
            this.getRequestFromAlma(`/users/${request.requester.value}`),
            of(null),
        ))
    );

    private userFromLoan = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(loan => this.getRequestFromAlma(`/users/${loan.user_id}`))
    );

    private userFromRequest = (link) => this.getRequestFromAlma(link).pipe(
        switchMap(request => iif(() => request.user_primary_id !== undefined,
            this.getRequestFromAlma(`/users/${request.user_primary_id}`),
            of(null)
        ))
    );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private fixConfigService: FixConfigService,
    ) {
    }

    private userFromAlmaUser = (almaUser, index) => almaUser === null ?
        {id: index, name: 'N/A', addresses: []} :
        {
            id: index,
            name: almaUser.full_name.search('null ') === 0 ? almaUser.full_name.replace('null ', '') : almaUser.full_name,
            addresses: almaUser.contact_info.address.map(
                address => ({
                    type: address.address_type[0].value,
                    address: this.convertToPrintableAddress(address)
                })
            ),
            selectedAddress: almaUser.contact_info.address.some(address => address.preferred === true)
                ? almaUser.contact_info.address.find(address => address.preferred === true).address_type[0].value
                : almaUser.contact_info.address.length > 0 ? almaUser.contact_info.address[0].address_type[0].value : 'none',
            checked: false
        };

    private getRequestFromAlma = link => this.restService.call(link);

    private convertToPrintableAddress = (addressObj: Address) => {
        let address: string = '';
        this.addressFormat.map((addressFormatLine, index) => {
            addressFormatLine.map(field => {
                    let value = field === 'country' ? addressObj[field].desc : addressObj[field];
                    address = addressObj[field] && !address.includes(value) ? address.concat(value).concat(' ') : address;
                }
            );
            // Recipient is empty here, it will be calculate in userFromAlmaUser
            // so No page break after first and last line please
            address = index + 1 !== this.addressFormat.length && index != 0 ? address + '<br/>' : address;
        });
        return address;
    };

    private handleError = (err: any) => {
        console.error(err);
        if (err.status === 401) {
            err.message = `It seems like you don't have the rights to see this page. 
                           Please contact your system administrator.`;
        }
        return throwError(err);
    };
}
