import {EMPTY, Observable, Subscription} from 'rxjs';
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
import {catchError, filter, map, switchMap, tap} from "rxjs/operators";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    //changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent{

    private numRecordsToPrint: number = 0;

    constructor(private restService: CloudAppRestService,
                private eventsService: CloudAppEventsService,
                private toastr: ToastrService,
                private userAddressInfoService: UserAddressInfoService
    ) {
    }

    usersAddress$ = this.eventsService.getPageMetadata()
        .pipe(
            catchError(err => EMPTY),
            map(pageInfo => pageInfo.entities),
            switchMap(entities => this.userAddressInfoService.usersAddress$(entities)),
            tap(item => console.log(item))
        );

    onListChanged = (e) => {
        this.usersAddress$.pipe(
            map(usersAddress => usersAddress[e.source.value].checked = e.checked),
            tap(usersAddress => console.log(usersAddress))
        );
        this.numRecordsToPrint = (e.checked) ? this.numRecordsToPrint + 1 : this.numRecordsToPrint - 1;
    };

    onAddressChanged = (e) => {
        let id, addressType;
        [id, addressType] = e.source.value.split('_');
        this.usersAddress$.pipe(
            map(usersAddress => usersAddress[id].desiredAddress = addressType)
        );
    };

    innerHtml$ = this.usersAddress$.pipe(
        tap(items=> console.log('innerhtml:',items)),
        map(usersInfo => usersInfo.filter(userInfo => userInfo.checked)),
        map(usersInfo => usersInfo.map( userInfo =>
            this.innerHtml$ + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo[userInfo.desiredAddress] + "</p></div>"
        )),
    );

    onPrintPreviewNewTab = () => {
        //let innerHtml: string = "";
        let printButton: string = "Print";

        console.log(this.innerHtml$);
        // this.usersAddress$.forEach(userInfo => {
        //     if (userInfo.checked) {
        //         innerHtml = innerHtml + "<div class='pageBreak'><p>" + userInfo.name + "</p><p>" + userInfo[userInfo.desiredAddress] + '</p></div>';
        //     }
        // });
        var content = "<html>";
        content += "<style>";
        content += "@media print {.hidden-print {display: none !important;}} div.pageBreak{page-break-after: always}";
        content += "</style>";
        content += "<body onload='window.print()'>";
        content += "<button class='hidden-print' onclick='window.print()'>";
        content += printButton;
        content += "</button>";
        content += this.innerHtml$;
        content += "</body>";
        content += "</html>";

        var win = window.open('', '', 'left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
        win.document.write(content);
        win.document.close();
    };

    onClearSelected = () => {
        // this.numRecordsToPrint = 0;
        // this.usersAddress$.forEach(userInfo => {
        //     userInfo.checked = false;
        // });
    };
}
