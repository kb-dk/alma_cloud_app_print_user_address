import {BehaviorSubject, combineLatest, EMPTY, Subject, Subscription} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';

import {Config} from "../config/config";
import {Settings} from "../settings/settings";
import {User} from "../user";

import {UserService} from '../user.service';
import {PartnerService} from '../partner.service';
import {ScanService} from "../scan.service";
import {HtmlService} from "./shared/html.service";

import {emptySettings} from "../settings/emptySettings"
import {emptyConfig} from "../config/emptyConfig";

import {FixConfigService} from "../fix-config.service";
import {
    CloudAppEventsService,
    CloudAppRestService,
    CloudAppConfigService,
    CloudAppSettingsService,
    Entity,
    PageInfo
} from '@exlibris/exl-cloudapp-angular-lib';
import {catchError, concatMap, map, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})

export class MainComponent implements OnInit, OnDestroy {

    settings: Settings = emptySettings;
    config: Config = emptyConfig;
    allPartnersSelected: boolean = false;
    entityType: string = 'USER';
    userFontSize: number = this.settings.addressDefaultFontSize;
    partnerFontSize: number = this.settings.addressDefaultFontSize;
    barcode: number;  // Borrowing request, status: "Returned by patron" for scan in items
    errorMessage: string = '';
    barcodeError: boolean = false;
    defaultTab: number = Number(this.settings.defaultTab);
    scannedPartner;
    loading: boolean = false;
    scannedPartnerReady: boolean = false;
    numUsersToPrint: number = 0;
    numPartnersToPrint: number = 0;
    senderAddress: string = '';
    printLogoUser: boolean = true;
    printLogoPartner: boolean = true;
    errorMsg: string = '';
    partnersReady: boolean = false;
    usersReady: boolean = false;

    private currentUserActions;
    private currentPartnerActions;
    private pageLoadSubscription: Subscription;
    private pageMetadataSubscription: Subscription;
    private pageLoadedSubject = new Subject<Entity[]>();


    partnerAction$ = this.pageLoadedSubject.asObservable().pipe(
        tap(entities => this.entityType = entities.length && entities[0].type === 'VENDOR' ? 'VENDOR' : 'USER'), // It is called user for every entity type except for vendor
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
            tap(([partners, selectedPartner, selectedAddressType]) => { // If there is only one partner, then select it by default
                if(partners.length === 1 && selectedPartner.id === -1 && selectedAddressType.id === -1){
                    this.numPartnersToPrint = 1;
                    partners[0].checked = true;
                }
            }),
            map(([partners, selectedPartner, selectedAddressType]) =>
                    partners.map((partner, requestIndex) => ({
                        ...partner,
                        selectedAddress: partner.id === selectedAddressType.id ? selectedAddressType.value : this.currentPartnerActions[requestIndex].selectedAddress,
                        checked: partner.id === selectedPartner.id ? selectedPartner.checked : this.currentPartnerActions[requestIndex].checked,
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
            tap(([users, selectedUser, selectedAddressType]) => { // If there is only one user, then select it by default
                if(users.length === 1 && selectedUser.id === -1 && selectedAddressType.id === -1){
                    this.numUsersToPrint = 1;
                    users[0].checked = true;
                }
            }),
            map(([users, selectedUser, selectedAddressType]) =>
                    users.map((user, requestIndex) => ({
                        ...user,
                        selectedAddress: user.id === selectedAddressType.id ? selectedAddressType.value : this.currentUserActions[requestIndex].selectedAddress,
                        checked: user.id === selectedUser.id ? selectedUser.checked : this.currentUserActions[requestIndex].checked,
                    }) as User),
                toArray(),
            ),
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
                private htmlService: HtmlService,
                private scanService: ScanService,
                private fixConfigService: FixConfigService
    ) {
    }

    ngOnInit(): void {
        this.pageMetadataSubscription = this.eventsService.getPageMetadata().subscribe(this.onPageLoad);
        this.pageLoadSubscription = this.eventsService.onPageLoad(this.onPageLoad);

        this.configService.get().subscribe(
            (config: Config) => {
                config = this.fixConfigService.fixOldOrEmptyConfigElements(config);
                this.config.user.logo = config.user.logo;
                this.config.addressFormat.showRecipient = config.addressFormat.showRecipient;
                this.config.partner.addresses = config.partner.addresses;
                if (this.config.partner.addresses.length && !this.senderAddress) {
                    this.senderAddress = this.replaceCommaWithLineBreak(this.config.partner.addresses[0]);
                }
            },
            err => console.error(err.message));

        this.settingsService.get().subscribe(
            (settings: Settings) => {
                console.log(settings);
                if (settings.hasOwnProperty('myAddress')){
                    this.senderAddress = settings.myAddress ? this.replaceCommaWithLineBreak(settings.myAddress) : this.config.partner.addresses[0] ? this.replaceCommaWithLineBreak(this.config.partner.addresses[0]) : '';
                } else {
                    this.senderAddress = this.config.partner.addresses.length ? this.replaceCommaWithLineBreak(this.config.partner.addresses[0]) : this.senderAddress;
                }

                this.settings.partnerPrintType = settings.hasOwnProperty('partnerPrintType') && settings.partnerPrintType;
                this.settings.labelHeight = settings.hasOwnProperty('labelHeight') && settings.labelHeight;
                this.settings.labelWidth = settings.hasOwnProperty('labelWidth') && settings.labelWidth;
                this.defaultTab = settings.hasOwnProperty('defaultTab') && Number(settings.defaultTab);
                this.settings.logoInBottom = settings.hasOwnProperty('logoInBottom') && settings.logoInBottom;
                this.settings.logoWidth = settings.hasOwnProperty('logoWidth') && settings.logoWidth;
                this.settings.addressTopMargin = settings.hasOwnProperty('addressTopMargin') && settings.addressTopMargin;
                this.settings.addressLeftMargin = settings.hasOwnProperty('addressLeftMargin') && settings.addressLeftMargin;
                this.settings.addressRightMargin = settings.hasOwnProperty('addressRightMargin') && settings.addressRightMargin;
                this.settings.addressBottomMargin = settings.hasOwnProperty('addressBottomMargin') && settings.addressBottomMargin;
                this.settings.addressDefaultFontSize = settings.hasOwnProperty('addressDefaultFontSize') && settings.addressDefaultFontSize;
                this.userFontSize = this.settings.addressDefaultFontSize;
                this.partnerFontSize = this.settings.addressDefaultFontSize;
                this.settings.addressWidth = settings.hasOwnProperty('addressWidth') && settings.addressWidth;
                this.settings.textBeforeAddress = settings.hasOwnProperty('textBeforeAddress') && settings.textBeforeAddress;
                this.settings.languageDirection = settings.hasOwnProperty('languageDirection') && settings.languageDirection;
                this.settings.paperSize = settings.hasOwnProperty('paperSize') && settings.paperSize;
                this.settings.paperMarginTop = settings.hasOwnProperty('paperMarginTop') && settings.paperMarginTop;
                this.settings.paperMarginBottom = settings.hasOwnProperty('paperMarginBottom') && settings.paperMarginBottom;
                this.settings.paperMarginLeft = settings.hasOwnProperty('paperMarginLeft') && settings.paperMarginLeft;
                this.settings.paperMarginRight = settings.hasOwnProperty('paperMarginRight') && settings.paperMarginRight;
                this.settings.multiAddressPerPage = settings.hasOwnProperty('multiAddressPerPage') && settings.multiAddressPerPage;
                this.settings.repeatAddress = settings.hasOwnProperty('repeatAddress') && settings.repeatAddress;
                this.settings.numAddressPerRow = settings.hasOwnProperty('numAddressPerRow') && parseInt(settings.numAddressPerRow.toString());
                this.settings.numAddressPerColumn = settings.hasOwnProperty('numAddressPerColumn') && parseInt(settings.numAddressPerColumn.toString());
                this.settings.cellPaddingLeft = settings.hasOwnProperty('cellPaddingLeft') && parseFloat(settings.cellPaddingLeft.toString());
                this.settings.cellPaddingRight = settings.hasOwnProperty('cellPaddingRight') && parseFloat(settings.cellPaddingRight.toString());
            },
            err => console.error(err.message)
        );
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

    onScan = () => {
        if (this.barcode) {
            this.loading = true;
            this.scanService.scan(this.barcode).subscribe(
                (data) => {
                    this.loading = false;
                    this.scannedPartner = data;
                    this.scannedPartnerReady = true;
                    this.onScannedPartnerPrint();
                },
                error => {
                    console.error('Error getting data from API:', error);
                    this.showError("Barcode is incorrect or partner doesn't exist");
                    this.loading = false;

                }
            );
        } else {
            this.showError('Please enter the barcode');
        }
    };

    showError = (errorMessage) => {
        this.errorMessage = errorMessage;
        this.barcodeError = true;
        setTimeout(() => {
            this.barcodeError = false;
        }, 3000);
    };

    onUserToggled = (e) => {
        this.numUsersToPrint = (e.checked) ? this.numUsersToPrint + 1 : this.numUsersToPrint - 1;
        let id;
        [, id] = e.source.value.split('_');
        this.userToggledSubject.next({id: +id, checked: e.checked});
    };

    onPartnerToggled = (e) => {
        this.numPartnersToPrint = (e.checked) ? this.numPartnersToPrint + 1 : this.numPartnersToPrint - 1;
        let id;
        [, id] = e.source.value.split('_');
        this.partnerToggledSubject.next({id: +id, checked: e.checked});
    };

    onAddressSelected = (e) => {
        let selectedId, selectedAddressType, userOrPartnerOrScannedPartner;
        [userOrPartnerOrScannedPartner, selectedId, selectedAddressType] = e.source.value.split('_');
        if (userOrPartnerOrScannedPartner === 'user') {
            this.userAddressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
        } else if (userOrPartnerOrScannedPartner === 'partner') {
            this.partnerAddressSelectedSubject.next({id: +selectedId, value: selectedAddressType});
        } else if (userOrPartnerOrScannedPartner === 'scannedPartner') {
            this.scannedPartner.selectedAddress = selectedAddressType;
        }
    };

    replaceCommaWithLineBreak = (string) => {
        let title = string.substring(0, string.indexOf(','));
        let address = string.substring(string.indexOf(','));
        string = '<strong>' + title + '</strong>' + address;
        return string.replaceAll(',', '<br/>')
    };

    getNumberOfSelectedAddresses = (partnerOrUsers) => {
        let count = 0;
        partnerOrUsers.forEach(partnerOrUser => {
            count = partnerOrUser.checked === true ? count +1 : count;
        });
        return count;
    };

    onUserPrint = () => {
        let innerHtml: string = this.settings.multiAddressPerPage ? "<div class='paper flex-container'>" : "";
        this.currentUserActions.map(user => {
            if (user.checked) {
                innerHtml = innerHtml.concat(this.htmlService.getHtmlForPaper(user, this.getNumberOfSelectedAddresses(this.currentUserActions), user.addresses, this.printLogoUser, this.settings.repeatAddress, this.settings.multiAddressPerPage, this.settings.numAddressPerRow, this.settings.numAddressPerColumn, this.config.user.logo, this.settings.textBeforeAddress, this.config.addressFormat.showRecipient));
            }
        });
        innerHtml = this.settings.multiAddressPerPage ? innerHtml + "</div>" : innerHtml;

        this.htmlService.printContent(innerHtml, 'user', this.settings.languageDirection, this.settings.logoWidth, this.settings.partnerPrintType, this.settings.multiAddressPerPage, this.settings.cellPaddingLeft, this.settings.cellPaddingRight, this.settings.numAddressPerRow, this.settings.addressLeftMargin, this.settings.addressRightMargin, this.settings.paperSize, this.settings.paperMarginLeft, this.settings.paperMarginRight, this.settings.paperMarginTop, this.settings.paperMarginBottom, this.settings.numAddressPerColumn, this.settings.addressTopMargin, this.settings.addressBottomMargin, this.settings.addressWidth, this.userFontSize, this.partnerFontSize, this.settings.logoInBottom, this.settings.labelWidth, this.settings.labelHeight);
    };

    onScannedPartnerPrint = () => {
        let innerHtml: string = this.settings.partnerPrintType === 'paper' && this.settings.multiAddressPerPage ? "<div class='paper flex-container'>" : "";
        if (this.scannedPartner && this.scannedPartner.checked) {
            let addresses: string;
            switch (this.settings.partnerPrintType) {
                case 'label': {
                    addresses = this.htmlService.getHtmlForLabel(this.scannedPartner, this.scannedPartner.receivers_addresses, this.config.addressFormat.showRecipient, this.senderAddress);
                    break;
                }
                case 'paper': {
                    addresses = this.htmlService.getHtmlForPaper(this.scannedPartner, 1, this.scannedPartner.receivers_addresses, this.printLogoPartner, this.settings.repeatAddress, this.settings.multiAddressPerPage, this.settings.numAddressPerRow, this.settings.numAddressPerColumn, this.config.user.logo, this.settings.textBeforeAddress, this.config.addressFormat.showRecipient);
                    break;
                }
                default: {
                    addresses = this.htmlService.getHtmlForLabel(this.scannedPartner, this.scannedPartner.receivers_addresses, this.config.addressFormat.showRecipient, this.senderAddress);
                    break;
                }
            }
            innerHtml = innerHtml.concat(addresses);
        }
        innerHtml = this.settings.partnerPrintType === 'paper' && this.settings.multiAddressPerPage ? innerHtml + "</div>" : innerHtml;
        this.htmlService.printContent(innerHtml, 'partner', this.settings.languageDirection, this.settings.logoWidth, this.settings.partnerPrintType, this.settings.multiAddressPerPage, this.settings.cellPaddingLeft, this.settings.cellPaddingRight, this.settings.numAddressPerRow, this.settings.addressLeftMargin, this.settings.addressRightMargin, this.settings.paperSize, this.settings.paperMarginLeft, this.settings.paperMarginRight, this.settings.paperMarginTop, this.settings.paperMarginBottom, this.settings.numAddressPerColumn, this.settings.addressTopMargin, this.settings.addressBottomMargin, this.settings.addressWidth, this.userFontSize, this.partnerFontSize, this.settings.logoInBottom, this.settings.labelWidth, this.settings.labelHeight);
    };

    onPartnerPrint = () => {
        let innerHtml: string = this.settings.partnerPrintType === 'paper' && this.settings.multiAddressPerPage ? "<div class='paper flex-container'>" : "";
        this.currentPartnerActions.map(partner => {
            if (partner.checked) {
                let addresses: string;
                switch (this.settings.partnerPrintType) {
                    case 'label': {
                        addresses = this.htmlService.getHtmlForLabel(partner, partner.receivers_addresses, this.config.addressFormat.showRecipient, this.senderAddress);
                        break;
                    }
                    case 'paper': {
                        addresses = this.htmlService.getHtmlForPaper(partner, this.getNumberOfSelectedAddresses(this.currentPartnerActions), partner.receivers_addresses, this.printLogoPartner, this.settings.repeatAddress, this.settings.multiAddressPerPage, this.settings.numAddressPerRow, this.settings.numAddressPerColumn, this.config.user.logo, this.settings.textBeforeAddress, this.config.addressFormat.showRecipient);
                        break;
                    }
                    default: {
                        addresses = this.htmlService.getHtmlForLabel(partner, partner.receivers_addresses, this.config.addressFormat.showRecipient, this.senderAddress);
                        break;
                    }
                }
                innerHtml = innerHtml.concat(addresses);
            }
        });
        innerHtml = this.settings.partnerPrintType === 'paper' && this.settings.multiAddressPerPage ? innerHtml + "</div>" : innerHtml;
        this.htmlService.printContent(innerHtml, 'partner', this.settings.languageDirection, this.settings.logoWidth, this.settings.partnerPrintType, this.settings.multiAddressPerPage, this.settings.cellPaddingLeft, this.settings.cellPaddingRight, this.settings.numAddressPerRow, this.settings.addressLeftMargin, this.settings.addressRightMargin, this.settings.paperSize, this.settings.paperMarginLeft, this.settings.paperMarginRight, this.settings.paperMarginTop, this.settings.paperMarginBottom, this.settings.numAddressPerColumn, this.settings.addressTopMargin, this.settings.addressBottomMargin, this.settings.addressWidth, this.userFontSize, this.partnerFontSize, this.settings.logoInBottom, this.settings.labelWidth, this.settings.labelHeight);
    };

    onSelectDeselectAllPartners(event, partners) {
        let numPartnersToPrint = 0;
        if (event.checked) {
            partners.map((partner, index) => {
                if (partner.name !== 'N/A') {
                    if (partner.checked === false){
                        this.partnerToggledSubject.next({id: +index, checked: true});
                    }
                    numPartnersToPrint += 1;
                }
            });
        } else {
            partners.map((partner, index) => {
                if ((partner.name !== 'N/A') || (partner.checked === false)) {
                    this.partnerToggledSubject.next({id: +index, checked: false});
                }
            });
        }
        this.numPartnersToPrint = numPartnersToPrint;
    }


    onSelectDeselectAllUsers(event, users) {
        let numUsersToPrint = 0;
        if (event.checked) {
            users.map((user, index) => {
                if (user.name !== 'N/A'){
                   if (user.checked === false){
                        this.userToggledSubject.next({id: +index, checked: true});
                   }
                   numUsersToPrint += 1;
                }
            });
        } else {
            users.map((user, index) => {
                if ((user.name !== 'N/A') && (user.checked === true)) {
                    this.userToggledSubject.next({id: +index, checked: false});
                }
            });
        }
        this.numUsersToPrint = numUsersToPrint;
    }
}
