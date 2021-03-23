/* Defines the ConfigAndSettings entity*/
export interface ConfigAndSettings {
    config: {
        user: {
            logo: string;
        }
        partner: {
            addresses: string[];
        }
    },
    settings: {
        myAddress: string;
    }
}