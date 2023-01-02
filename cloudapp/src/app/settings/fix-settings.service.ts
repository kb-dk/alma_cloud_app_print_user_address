import {Injectable} from "@angular/core";
import {Settings} from "./settings";
import {Config} from "../config/config";

@Injectable({
    providedIn: 'root'
})

export class FixSettingsService {

    constructor(
    ) {
    }

    fixSettings = (settings, config: Config): Settings => {
        settings.numAddressPerRow = parseInt(settings.numAddressPerRow.toString());
        settings.numAddressPerColumn = parseInt(settings.numAddressPerColumn.toString());
        settings.cellPaddingLeft = parseFloat(settings.cellPaddingLeft.toString());
        settings.cellPaddingRight = parseFloat(settings.cellPaddingRight.toString());
        if (!settings.myAddress && config.partner.addresses.length) {
            settings.myAddress = config.partner.addresses[0];
        }
        return settings;
    }
}