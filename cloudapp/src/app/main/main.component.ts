import {BehaviorSubject, combineLatest, EMPTY, Subject, Subscription} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../user.service';
import {PartnerService} from '../partner.service';
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    Entity,
    PageInfo
} from '@exlibris/exl-cloudapp-angular-lib';
import {User} from "../user";
import {catchError, concatMap, map, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})

export class MainComponent implements OnInit, OnDestroy {

    numUsersToPrint: number = 0;
    numPartnersToPrint: number = 0;
    logoUrl: string = '';
    senderAddresses = [];
    senderAddress : string = '';
    printLogo: boolean = true;
    errorMsg: string = '';
    selectedTab: string = "0";
    partnersReady: boolean = false;
    usersReady: boolean = false;

    private currentUserActions;
    private currentPartnerActions;
    private pageLoadSubscription: Subscription;
    private pageMetadataSubscription: Subscription;
    private pageLoadedSubject = new Subject<Entity[]>();


    partnerAction$ = this.pageLoadedSubject.asObservable().pipe(
        concatMap(entities => this.partnerService.partners$(entities)),
        tap(currentPartnerAction => this.currentPartnerActions = currentPartnerAction),
        tap(result => console.log('result:',result)),
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
            // tap(([partners, selectedPartner, selectedAddressType]) => console.log([partners, selectedPartner])),
            map(([partners, selectedPartner, selectedAddressType]) =>
                    partners.map((partner, requestIndex) => ({
                        ...partner,
                        selectedAddress: partner.id === selectedAddressType.id ? selectedAddressType.value : this.currentPartnerActions[requestIndex].selectedAddress,
                        checked: partner.id === selectedPartner.id ? selectedPartner.checked : partner.id === 0,
                    }) as User),
                toArray(),
            ),
            tap(currentPartnerActions => this.currentPartnerActions = currentPartnerActions),
            // tap(currentPartnerActions => console.log(currentPartnerActions)),
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
            // tap(([users, selectedUser, selectedAddressType]) => console.log([users, selectedUser, selectedAddressType])),
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
                private eventsService: CloudAppEventsService,
                private userService: UserService,
                private partnerService: PartnerService
    ) {
    }

    ngOnInit(): void {
        this.pageMetadataSubscription = this.eventsService.getPageMetadata().subscribe(this.onPageLoad);
        this.pageLoadSubscription = this.eventsService.onPageLoad(this.onPageLoad);

        this.configService.get().subscribe(
            config => {
                this.logoUrl = config.user.logo;
                this.senderAddresses = config.partner.addresses;
                this.senderAddress = this.replaceComma(this.senderAddresses[0]);
            },
            err => console.log(err.message));
    }

    ngOnDestroy(): void {
        this.pageLoadSubscription.unsubscribe();
        this.pageMetadataSubscription.unsubscribe();
    }

    onPageLoad = (pageInfo: PageInfo) => {
        console.log("step 1:", pageInfo);
        this.onClear();
        this.partnersReady = false;
        this.usersReady = false;
        this.pageLoadedSubject.next(pageInfo.entities);
    };

    onPrintLogoToggled = (e) => {
        this.printLogo = e.checked;
    };

    onPrintSenderAddress = (e) => {
        this.senderAddress = this.replaceComma(e.value);
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
        console.log(id , e.checked);
        this.partnerToggledSubject.next({id: +id, checked: e.checked});
    };

    onAddressSelected = (e) => {
        let selectedId, selectedAddressType, userOrPartner;
        [userOrPartner, selectedId, selectedAddressType] = e.source.value.split('_');
        if (userOrPartner === 'user'){
            this.userAddressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
        } else {
            this.partnerAddressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
        }
    };

    replaceComma = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>'+title+'</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };

    onUserPrint = () => {
        let innerHtml: string = "";

        this.currentUserActions.map(user => {
            if (user.checked) {
                let logo = this.printLogo&&this.logoUrl?`<div style="float: right; width: 25%"><img src="${this.logoUrl}" style="max-width: 100%;"/></div>`:'';
                innerHtml = innerHtml.concat(
                    `<div class='pageBreak'>
                      ${logo}  
                      <p style="position: relative; top:2cm; width:9cm;">${user.name}<br/>
                      ${user.addresses.find(address => address.type === user.selectedAddress).address}</p>
                  </div>`);
            }
        });

        let content = `<html>
                       <style>@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}@page {margin-top: 2cm;margin-bottom: 2cm;margin-left: 2cm;margin-right: 2cm;}</style>
                           <body onload='window.print();' style="font-size:80%; font-family: sans-serif; font-weight:600; margin: 0;">
                               ${innerHtml}
                           </body>
                       </html>`;
        this.printContent(content);
    };

    onPartnerPrint = () => {
        let innerHtml: string = "";

        this.currentPartnerActions.map(partner => {
            if (partner.checked) {
                innerHtml = innerHtml.concat(
                    `<div class='pageBreak' style="position:relative; border:solid black 1px; width: 10cm; height: 5.5cm; padding:0.15cm;">  
                      <div class="recipient" style="position: relative;">${partner.name}<br/>
                      ${partner.receivers_addresses.find(address => address.type === partner.selectedAddress).address}</div>
                      <div class="sender" style="position: absolute; bottom:0.15cm; left:0.8cm;">${this.senderAddress}</div>
                      <!--<p style="position: absolute; bottom:0; left:0.8cm;">${partner.senders_address}</p>-->
                  </div>`);
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

    printContent = (content) => {
        let win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        // console.log(content);
        win.document.write(content);
        win.document.close();
    };
}
