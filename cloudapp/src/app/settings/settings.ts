/* Defines the Settings entity*/
export interface Settings {
    myAddress: string;
    partnerPrintType: string;
    labelWidth: string;
    labelHeight: string;
    defaultTab: string;
    logoInBottom: boolean;
    logoWidth: string;
    languageDirection: string;
    paperSize: string;
    paperMargin: string;
    multiAddressPerPage: boolean;
    repeatAddress: boolean;
    numAddressPerRow: number;
    numAddressPerColumn: number;
}