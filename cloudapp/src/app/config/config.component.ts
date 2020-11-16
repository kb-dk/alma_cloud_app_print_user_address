import {Component, OnInit} from '@angular/core';
import {CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html',
    styleUrls: ['./config.component.scss']
})

export class ConfigComponent implements OnInit {


    constructor() {
    }

    ngOnInit() {
    }

}
