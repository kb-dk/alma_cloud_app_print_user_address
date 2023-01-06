export interface User {
    id: number;
    name: string;
    selectedAddress?: string;
    receivers_addresses?: [{ type?:string; address?:string;}]|[];
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
    country: { value: string; desc: string
    };
    address_note: string;
    preferred: boolean;
    segment_type: string;
    address_type: [ {     value: string;     desc: string; }
    ]
}

export interface AlmaUser{
    gender?: { value?: string, desc?: string
    },
    password?: string,
    status?: { value?: string, desc?: string
    },
    requests?: [],
    loans?: [],
    fees?: [],
    researcher?: string,
    record_type?: { value?: string, desc?: string
    },
    primary_id?: string,
    first_name?: string,
    middle_name?: string,
    name?: string,
    last_name?: string,
    full_name?: string,
    pin_number?: string,
    user_title?: { value?: string, desc?: string
    },
    job_category?: { value?: string, desc?: string
    },
    job_description?: string,
    user_group?: { value?: string, desc?: string
    },
    campus_code?: { value?: string, desc?: string
    },
    web_site_url?: string,
    cataloger_level?: { value?: string, desc?: string
    },
    preferred_language?: { value?: string, desc?: string
    },
    birth_date?: string,
    expiry_date?: string,
    purge_date?: string,
    account_type?: { value?: string, desc?: string
    },
    external_id?: string,
    force_password_change?: boolean,
    status_date?: string,
    last_patron_activity_date?: string,
    contact_info: { address: Address[], email?: [{}], phone?: [{}],
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
    partner_details: { code: string, name: string, status: string, currency: string, profile_details: {     profile_type: string,     art_email_details: string,     ncip_details: string,     iso_details: string,     iso_18626_details: string,     email_details: {         email: string,         resending_overdue_message_interval: string     },     ncip_p2p_details: string,     bldss_details: string,     fulfillment_network_details: string,     rapid_details: string,     innreach_details: string }, system_type: {     value: string,     desc: string }, avg_supply_time: string, delivery_delay: string, borrowing_supported: boolean, borrowing_workflow: string, lending_supported: boolean, lending_workflow: string, auto_cancel_supported: boolean, auto_cancel_reason: string, auto_cancel_time: string, auto_claim_supported: boolean, auto_claim_time: string, locate_profile: {     value: string,     desc: string }, institution_code: string, holding_code: string
    },
    contact_info: { address: Address[], phone: [], email: []
    },
    note: [],
    link: string
}

export interface AlmaLendingRequest {
    additional_barcode: string;
    additional_person_name: string;
    agree_to_copyright_terms: string;
    allow_other_formats: boolean;
    author: string;
    author_initials:string;
    barcode: string;
    bib_note: string;
    call_number: string;
    chapter: string;
    chapter_author: string;
    chapter_title: string;
    citation_type: {value: string; desc: string;}
    copyright_status: {value: string; desc: string;}
    created_date: string;
    created_time: string;
    doi: string;
    edition: string;
    editor: string;
    end_page: string;
    external_id: string;
    format: {value: string; desc: string;}
    fund: string;
    has_active_notes: boolean;
    isbn: string;
    issn:string;
    issue: string;
    journal_title: string;
    last_interest_date: string;
    last_modified_date: string;
    last_modified_time: string;
    lcc_number: string;
    level_of_service: {value: string; desc: string;}
    lost_damaged_fee: string;
    maximum_fee: string;
    mms_id: string;
    need_patron_info: string;
    note: string;
    oclc_number: string;
    other_standard_id: string;
    owner: string;
    pages: string;
    part: string;
    partner: {value:  string; desc:  string; link:  string;}
    pickup_location: string;
    pickup_location_type: string;
    place_of_publication: string;
    pmid: string;
    preferred_send_method: string;
    printed: boolean;
    publisher: string;
    reading_room: string;
    receive_cost: string;
    remote_record_id: string;
    reported: boolean;
    request_cost: string;
    request_id: string;
    requested_language: string;
    requested_media: string;
    requester: string;
    rs_note:[];
    series_title_number: string;
    shipping_cost: {sum: string; currency: {}}
    source: string;
    specific_edition: string;
    start_page: string;
    status: { value: string; desc: string;}
    supplied_format: { value: string; desc: string;}
    text_email: string;
    text_postal_1: string;
    text_postal_2: string;
    text_postal_3: string;
    text_postal_4: string;
    title: string;
    use_alternative_address: string;
    user_request: { value: string; link: string; }
    volume: string;
    willing_to_pay: string;
    year: string;
}

export interface AlmaRequest {
    additional_id: string;
    adjusted_booking_end_date:  string;
    adjusted_booking_start_date:  string;
    author:  string;
    barcode: string;
    booking_end_date:  string;
    booking_start_date:  string;
    call_number:  string;
    call_number_type:  string;
    chapter_or_article_author:  string;
    chapter_or_article_title:  string;
    comment:  string;
    copyrights_declaration_signed_by_patron:  string;
    date_of_publication: string;
    description:  string;
    destination_location:  string;
    due_back_date:  string;
    expiry_date: string;
    full_chapter:  string;
    holding_id:  string;
    issue: string;
    item_id: string;
    item_policy:  string;
    last_interest_date:  string;
    managed_by_circulation_desk:  string;
    managed_by_circulation_desk_code:  string;
    managed_by_library:  string;
    managed_by_library_code:  string;
    manual_description:  string;
    material_type: {value: string; desc: string;}
    mms_id: string;
    part:  string;
    partial_digitization:  string;
    pickup_location:  string;
    pickup_location_circulation_desk:  string;
    pickup_location_institution:  string;
    pickup_location_library:  string;
    pickup_location_type:  string;
    place_in_queue:  string;
    request_date: string;
    request_id: string;
    request_status: string;
    request_sub_type: {value: string; desc: string;}
    request_time: string;
    request_type: string;
    required_pages_range:  string;
    resource_sharing:  string;
    target_destination: {value: string; desc: string;}
    task_name: string;
    title: string;
    user_primary_id:  string;
    volume:  string;
}

