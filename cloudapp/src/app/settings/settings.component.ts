import {Component, OnInit} from '@angular/core';
import {AppService} from '../app.service';
import {CloudAppSettingsService} from '@exlibris/exl-cloudapp-angular-lib';
import {ToastrService} from 'ngx-toastr';
// import {Settings} from '../models/settings';
// import {ExternalLinkTemplate} from "../models/external-link-template";
import {MatDialog} from "@angular/material/dialog";
// import {SettingsDialogComponent} from "./settings-dialog/settings-dialog.component";

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    // externalLinkTemplates: ExternalLinkTemplate[] = [];
    settings;
    saving = false;
    dialogOpen: boolean = false;

    constructor(
        private appService: AppService,
        private settingsService: CloudAppSettingsService,
        private toastr: ToastrService,
        public dialog: MatDialog
    ) { }

    ngOnInit() {
        // this.appService.setTitle('Settings');
        this.getSettings();
    }

    private getSettings() {
        this.settingsService.get().subscribe(result => {
            console.log(result);
            this.settings = result;
        })
    }

    private saveSettings(toastMessage:string) {
        this.saving = true;
        this.settingsService.set(this.settings).subscribe(
            response => {
                this.toastr.success(toastMessage, 'Settings updated', {timeOut:10000});
            },
            err => this.toastr.error(err.message, '', {timeOut:10000}),
            () => this.saving = false
        );
        this.saving = false;
    }

    // remove(removableExternalLinkTemplate: ExternalLinkTemplate) {
    //     this.settings.externalLinkTemplates = this.settings.externalLinkTemplates.filter(externalLinkTemplate => externalLinkTemplate.id != removableExternalLinkTemplate.id);
    //     this.saveSettings('Template: ' + removableExternalLinkTemplate.linkName + ' removed from settings.');
    // }

    // openDialog() {
    //     this.dialogOpen = true;
    //     const dialogRef = this.dialog.open(SettingsDialogComponent, {
    //         width: '95%',
    //         data: new ExternalLinkTemplate()
    //     });

        // dialogRef.afterClosed().subscribe(result  => {
        //     result = result as ExternalLinkTemplate;
        //     this.dialogOpen = false;
        //     const readyForSaving = result.searchCriteriaType>0 && result.linkName != '' && result.startOfLink != ''
        //     if (readyForSaving) {
        //         this.settings.externalLinkTemplates.push(result);
        //         this.saveSettings('Localization-link: ' + result.linkName + ' saved to settings.');
        //     }
        // });
    // }

}