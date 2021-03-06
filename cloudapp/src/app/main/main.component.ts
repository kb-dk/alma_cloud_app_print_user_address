import {BehaviorSubject, combineLatest, EMPTY, of, Subject, Subscription} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../user.service';
import {PartnerService} from '../partner.service';
import {AddressFormats} from '../config/address-format';
import {FixConfigService} from "../fix-config.service";
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    CloudAppSettingsService,
    Entity,
    PageInfo
} from '@exlibris/exl-cloudapp-angular-lib';
import {Config} from "../config/config";
import {Settings} from "../settings/settings";
import {User} from "../user";
import {catchError, concatMap, map, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})

export class MainComponent implements OnInit, OnDestroy {

    barcode: number = 550010441358;
    userFontSize: number = 17;
    partnerFontSize: number = 17;
    numUsersToPrint: number = 0;
    numPartnersToPrint: number = 0;
    logoUrl: string = '';
    senderAddresses = [];
    senderAddress: string = '';
    printLogoUser: boolean = true;
    printLogoPartner: boolean = true;
    errorMsg: string = '';
    selectedTab: string = "0";
    partnersReady: boolean = false;
    usersReady: boolean = false;
    addressFormats = AddressFormats;
    partnerPrintType: string = '';

    private currentUserActions;
    private currentPartnerActions;
    private pageLoadSubscription: Subscription;
    private pageMetadataSubscription: Subscription;
    private pageLoadedSubject = new Subject<Entity[]>();


    partnerAction$ = this.pageLoadedSubject.asObservable().pipe(
        concatMap(entities => this.partnerService.partners$(entities)),
        tap(currentPartnerAction => this.currentPartnerActions = currentPartnerAction),
        tap(() => this.partnersReady = true),
    );

    pageLoadedAction$ = this.pageLoadedSubject.asObservable().pipe(
        concatMap(entities => this.userService.users$(entities)),
        tap(currentUserAction => this.currentUserActions = currentUserAction),
        tap(() => this.usersReady = true),
    );

    private userToggledSubject = new BehaviorSubject<{ id: number, checked: boolean }>({id: -1, checked: false});
    userToggledAction$ = this.userToggledSubject.asObservable();

    private partnerToggledSubject = new BehaviorSubject<{ id: number, checked: boolean }>({id: -1, checked: false});
    partnerToggledAction$ = this.partnerToggledSubject.asObservable();

    private userAddressSelectedSubject = new BehaviorSubject<{ id: number, value: string }>({id: -1, value: ''});
    userAddressSelectedAction$ = this.userAddressSelectedSubject.asObservable();

    private partnerAddressSelectedSubject = new BehaviorSubject<{ id: number, value: string }>({id: -1, value: ''});
    partnerAddressSelectedAction$ = this.partnerAddressSelectedSubject.asObservable();

    partnerActions$ = combineLatest([
        this.partnerAction$,
        this.partnerToggledAction$,
        this.partnerAddressSelectedAction$
    ])
        .pipe(
            map(([partners, selectedPartner, selectedAddressType]) =>
                    partners.map((partner, requestIndex) => ({
                        ...partner,
                        selectedAddress: partner.id === selectedAddressType.id ? selectedAddressType.value : this.currentPartnerActions[requestIndex].selectedAddress,
                        checked: partner.id === selectedPartner.id ? selectedPartner.checked : partner.id === 0,
                    }) as User),
                toArray(),
            ),
            tap(currentPartnerActions => this.currentPartnerActions = currentPartnerActions),
            catchError(error => {
                this.errorMsg = error.message;
                return EMPTY;
            }),
        );

    userActions$ = combineLatest([
        this.pageLoadedAction$,
        this.userToggledAction$,
        this.userAddressSelectedAction$
    ])
        .pipe(
            map(([users, selectedUser, selectedAddressType]) =>
                    users.map((user, requestIndex) => ({
                        ...user,
                        selectedAddress: user.id === selectedAddressType.id ? selectedAddressType.value : this.currentUserActions[requestIndex].selectedAddress,
                        checked: user.id === selectedUser.id ? selectedUser.checked : this.currentUserActions[requestIndex].checked,
                    }) as User),
                toArray(),
            ),
            tap(currentUserActions => this.numPartnersToPrint = currentUserActions.length),
            tap(currentUserActions => this.currentUserActions = currentUserActions),
            catchError(error => {
                this.errorMsg = error.message;
                return EMPTY;
            }),
        );

    constructor(private restService: CloudAppRestService,
                private configService: CloudAppConfigService,
                private settingsService: CloudAppSettingsService,
                private eventsService: CloudAppEventsService,
                private userService: UserService,
                private partnerService: PartnerService,
                private fixConfigService: FixConfigService
    ) {
    }

    ngOnInit(): void {
        this.pageMetadataSubscription = this.eventsService.getPageMetadata().subscribe(this.onPageLoad);
        this.pageLoadSubscription = this.eventsService.onPageLoad(this.onPageLoad);

        this.configService.get().subscribe(
            (config: Config) => {
                config = this.fixConfigService.fixOldOrEmptyConfigElements(config);
                this.logoUrl = config.user.logo;
                this.senderAddresses = config.partner.addresses;
                if (this.senderAddresses.length && !this.senderAddress) {
                    this.senderAddress = this.replaceComma(this.senderAddresses[0]);
                }
            },
            err => console.log(err.message));

        this.settingsService.get().subscribe(
            (settings: Settings) => {
                if (settings.hasOwnProperty('myAddress')) {
                    this.senderAddress = settings.myAddress ? this.replaceComma(settings.myAddress) : this.replaceComma(this.senderAddresses[0]);
                } else {
                    this.senderAddress = this.senderAddresses.length ? this.replaceComma(this.senderAddresses[0]) : this.senderAddress;
                }

                this.partnerPrintType = settings.hasOwnProperty('partnerPrintType') ? settings.partnerPrintType : 'label';
            },
            err => console.log(err.message));
    }

    ngOnDestroy(): void {
        this.pageLoadSubscription.unsubscribe();
        this.pageMetadataSubscription.unsubscribe();
    }

    onPageLoad = (pageInfo: PageInfo) => {
        this.onClear();
        this.partnersReady = false;
        this.usersReady = false;
        this.pageLoadedSubject.next(pageInfo.entities);
    };

    onPrintLogoUserToggled = (e) => {
        this.printLogoUser = e.checked;
    };

    onPrintLogoPartnerToggled = (e) => {
        this.printLogoPartner = e.checked;
    };

    onClear = () => {
        this.numUsersToPrint = 0;
        this.numPartnersToPrint = 0;
        this.userAddressSelectedSubject.next({id: -1, value: ''});
        this.userToggledSubject.next({id: -1, checked: false});
        if (typeof this.currentUserActions !== 'undefined') {
            this.currentUserActions.map(user => {
                user.checked = false;
            });
        }
        if (typeof this.currentPartnerActions !== 'undefined') {
            this.currentPartnerActions.map(user => {
                user.checked = false;
            });
        }
    };

    onUserToggled = (e) => {
        this.numUsersToPrint = (e.checked) ? this.numUsersToPrint + 1 : this.numUsersToPrint - 1;
        let user, id;
        [user, id] = e.source.value.split('_');
        this.userToggledSubject.next({id: +id, checked: e.checked});
    };

    onPartnerToggled = (e) => {
        this.numPartnersToPrint = (e.checked) ? this.numPartnersToPrint + 1 : this.numPartnersToPrint - 1;
        let partner, id;
        [partner, id] = e.source.value.split('_');
        this.partnerToggledSubject.next({id: +id, checked: e.checked});
    };

    onAddressSelected = (e) => {
        let selectedId, selectedAddressType, userOrPartner;
        [userOrPartner, selectedId, selectedAddressType] = e.source.value.split('_');
        if (userOrPartner === 'user') {
            this.userAddressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
        } else {
            this.partnerAddressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
        }
    };

    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>' + title + '</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };

    onUserPrint = () => {
        let innerHtml: string = "";
        this.currentUserActions.map(user => {
            if (user.checked) {
                innerHtml = innerHtml.concat(this.getHtmlForPaper(user, user.addresses, this.printLogoUser, this.userFontSize));
            }
        });

        let content = `<html>
                       <style>@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}@page {margin-top: 2cm;margin-bottom: 2cm;margin-left: 2cm;margin-right: 2cm;}</style>
                           <body onload='window.print();' style="font-size:15px; font-family: sans-serif; font-weight:600; margin: 0;">
                               ${innerHtml}
                           </body>
                       </html>`;
        this.printContent(content);
    };

    onPartnerPrint = () => {
        let innerHtml: string = "";
        this.currentPartnerActions.map(partner => {
            if (partner.checked) {
                let addresses : string;
                switch(this.partnerPrintType) {
                    case 'label': {
                        addresses = this.getHtmlForLabel(partner, partner.receivers_addresses);
                        break;
                    }
                    case 'paper': {
                        addresses = this.getHtmlForPaper(partner, partner.receivers_addresses, this.printLogoPartner, this.partnerFontSize);
                        break;
                    }
                    default: {
                        addresses = this.getHtmlForLabel(partner, partner.receivers_addresses);
                        break;
                    }
                }
                innerHtml = innerHtml.concat(addresses);
            }
        });

        let content = `<html>
                       <style>
                       @media print {
                       .hidden-print {display: none !important;}
                       } 
                       div.pageBreak{
                       page-break-after: always
                       }
                       @page{
                       margin:0;
                       }
                       .sender strong{
                       font-weight: bold; 
                       font-size: 18px;
                       }
                       .sender:before{
                       content:"";
                       position:absolute;
                       border-top:1px solid black;
                       width:7cm;
                       transform: rotate(13deg);
                       transform-origin: 0% 0%;
                       }
                       .sender:after{
                       content:"";
                       position:absolute;
                       left:0;
                       bottom:0.1cm;
                       border-bottom:1px solid black;
                       width:7cm;
                       transform: rotate(-13deg);
                       transform-origin: 0% 0%;
                       }
                       </style>
                           <body onload='window.print();' style="font-size:80%; font-family: sans-serif; font-weight:600; margin: 0;">
                               ${innerHtml}
                           </body>
                       </html>`;
        this.printContent(content);
    };

    getHtmlForLabel = (partner, addresses) => `<div class='pageBreak' style="position:relative; border:solid black 1px; width: 10cm; height: 5.5cm; padding:0.15cm;">  
                      <div class="recipient" style="position: relative;">${partner.name}<br/>
                      ${addresses.find(address => address.type === partner.selectedAddress).address}</div>
                      <div class="sender" style="position: absolute; bottom:0.15cm; left:0.8cm;">${this.senderAddress}</div>
                  </div>`;

    getHtmlForPaper = (partner, addresses, printLogo, fontSize) => `<div class='pageBreak' style="width: 21cm; height:20cm">
                      ${this.getLogo(printLogo)}  
                      <p style="position: relative; top:2cm; width:9cm; font-size: ${fontSize || 17}px">${partner.name}<br/>
                      ${addresses.find(address => address.type === partner.selectedAddress).address}</p>
                  </div>`;

    getLogo = (printLogo) =>   printLogo && this.logoUrl ? `<div style="float: right; width: 25%"><img src="${this.logoUrl}" style="max-width: 100%;"/></div>` : '';


    printContent = (content) => {
        let win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        win.document.write(content);
        win.document.close();
    };
}
