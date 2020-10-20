import {BehaviorSubject, combineLatest, EMPTY, from, Observable, Subscription} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {UserAddressInfoService} from '../userAddressInfo.service';
import {
    CloudAppEventsService,
    CloudAppRestService,
    Entity,
    PageInfo,
} from '@exlibris/exl-cloudapp-angular-lib';
import {UserAddressInfo} from "../userAddressInfo";
import {catchError, concatMap, filter, map, mergeMap, switchMap, tap, toArray} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    //changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent {

    private numRecordsToPrint: number = 0;
    private currentState;

    usersAddress$ = this.eventsService.getPageMetadata()
        .pipe(
            map(pageInfo => pageInfo.entities),
            concatMap(entities => this.userAddressInfoService.usersAddress$(entities)),
            toArray(),
            tap(currentInfo => this.currentState = currentInfo)
        );

    private clickedUserNameSubject = new BehaviorSubject<[number, boolean]>([-1, false]);
    clickedUserNameAction$ = this.clickedUserNameSubject.asObservable();

    private clickedAddressSubject = new BehaviorSubject<[number, string]>([-1, '']);
    clickedAddressAction$ = this.clickedAddressSubject.asObservable();

    userAddressWithPrintInfo$ = combineLatest([
        this.usersAddress$,
        this.clickedUserNameAction$,
        this.clickedAddressAction$
    ])
        .pipe(
            map(([usersAddress, selectedUserInfo, selectedUserIdAndAddressType]) =>
                usersAddress.map((userAddress, index) => ({
                    ...userAddress,
                    desiredAddress: userAddress.id === selectedUserIdAndAddressType[0]? selectedUserIdAndAddressType[1] :this.currentState[index].desiredAddress,
                    checked: userAddress.id === selectedUserInfo[0]? selectedUserInfo[1]:this.currentState[index].checked,
                }) as UserAddressInfo),
                toArray(),
            ),
            tap(currentInfo => this.currentState = currentInfo),
            catchError(err => EMPTY),
        );

    constructor(private restService: CloudAppRestService,
                private eventsService: CloudAppEventsService,
                private toastr: ToastrService,
                private userAddressInfoService: UserAddressInfoService
    ) {
    }

    onUserNameClick = (e) => {
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
        this.clickedUserNameSubject.next([e.source.value, e.checked]);
    };

    onAddressClick = (e) => {
         let id, addressType;
        [id, addressType] = e.source.value.split('_');
        this.clickedAddressSubject.next([+id, addressType]);
    };

    onPrintPreviewNewTab = () => {
        let innerHtml: string = "";
        let printButton: string = "Print";

        this.currentState.map(userInfo => {
            if (userInfo.checked) {
                innerHtml = innerHtml + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo.addresses.find(address => address.type === userInfo.desiredAddress).address + '</p></div>';
            }
        });

        let content = "<html>";
        content += "<style>";
        content += "@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}";
        content += "</style>";
        content += "<body onload='window.print()'>";
        content += "<button class='hidden-print' onclick='window.print()'>";
        content += printButton;
        content += "</button>";
        content += innerHtml;
        content += "</body>";
        content += "</html>";

        var win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        win.document.write(content);
        win.document.close();
    };

    onClearSelected = () => {
        this.numRecordsToPrint = 0;
        this.currentState.map(userInfo => {
            userInfo.checked = false;
        });
    };
}
