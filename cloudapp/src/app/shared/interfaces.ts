/* Defines the Receiver entity (the ultimate user object shape) */
export interface User {
    id: number;
    name: string;
    selectedAddress?: string;
    receivers_addresses?: [{
        type?:string;
        address?:string;
    }];
    senders_address?: string;
    checked?: boolean;
}

export interface Address {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
    line5: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: {
        value: string;
        desc: string
    };
    address_note: string;
    preferred: boolean;
    segment_type: string;
    address_type: [
        {
            value: string;
            desc: string;
        }
    ]
}

export interface AlmaUser{
    gender?: {
        value?: string,
        desc?: string
    },
    password?: string,
    status?: {
        value?: string,
        desc?: string
    },
    requests?: [],
    loans?: [],
    fees?: [],
    researcher?: string,
    record_type?: {
        value?: string,
        desc?: string
    },
    primary_id?: string,
    first_name?: string,
    middle_name?: string,
    name?: string,
    last_name?: string,
    full_name?: string,
    pin_number?: string,
    user_title?: {
        value?: string,
        desc?: string
    },
    job_category?: {
        value?: string,
        desc?: string
    },
    job_description?: string,
    user_group?: {
        value?: string,
        desc?: string
    },
    campus_code?: {
        value?: string,
        desc?: string
    },
    web_site_url?: string,
    cataloger_level?: {
        value?: string,
        desc?: string
    },
    preferred_language?: {
        value?: string,
        desc?: string
    },
    birth_date?: string,
    expiry_date?: string,
    purge_date?: string,
    account_type?: {
        value?: string,
        desc?: string
    },
    external_id?: string,
    force_password_change?: boolean,
    status_date?: string,
    last_patron_activity_date?: string,
    contact_info: {
        address: Address[],
        email?: [{}],
        phone?: [{}],
    },
    user_identifier?: [],
    user_role?: [],
    user_block?: [],
    user_note?: [],
    user_statistic?: [],
    proxy_for_user?: [],
    rs_library?: string,
    library_notice?: string,
    source_link_id?: string,
    source_institution_code?: string,
    linking_id?: string,
    pref_first_name?: string,
    pref_middle_name?: string,
    pref_last_name?: string,
    pref_name_suffix?: string,
    is_researcher?: boolean,
    link?: string
}

export interface AlmaPartner {
    partner_details: {
        code: string,
        name: string,
        status: string,
        currency: string,
        profile_details: {
            profile_type: string,
            art_email_details: string,
            ncip_details: string,
            iso_details: string,
            iso_18626_details: string,
            email_details: {
                email: string,
                resending_overdue_message_interval: string
            },
            ncip_p2p_details: string,
            bldss_details: string,
            fulfillment_network_details: string,
            rapid_details: string,
            innreach_details: string
        },
        system_type: {
            value: string,
            desc: string
        },
        avg_supply_time: string,
        delivery_delay: string,
        borrowing_supported: boolean,
        borrowing_workflow: string,
        lending_supported: true,
        lending_workflow: string,
        auto_cancel_supported: false,
        auto_cancel_reason: string,
        auto_cancel_time: string,
        auto_claim_supported: false,
        auto_claim_time: string,
        locate_profile: {
            value: string,
            desc: string
        },
        institution_code: string,
        holding_code: string
    },
    contact_info: {
        address: Address[],
        phone: [],
        email: []
    },
    note: [],
    link: string
}

