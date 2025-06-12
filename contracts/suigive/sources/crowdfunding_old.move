
module suigive::crowdfunding_old;

use std::string::String;
use sui::{
    balance::{Self, Balance},
    coin::{Self, Coin},
    event,
    sui::SUI,
    table::{Self, Table}
};
use suigive::{
    donation_receipt,
    sg_sui_token::{Self, SgSuiTreasury, SgSuiMinterCap}
};

const EFundingDeadlineInPast: u64 = 1;
const EFundingGoalZero: u64 = 2;
const ENotFundOwner: u64 = 5;
const EFundingEnded: u64 = 6;
const EInsufficientFunds: u64 = 7;
const ENotAdmin: u64 = 8;
const EPercentageExceeds100: u64 = 9;
const ECampaignNotActive: u64 = 10;
const EInvalidBeneficialParties: u64 = 11;
const EAlreadyWithdrawn: u64 = 12;


const PERCENTAGE_SCALE: u64 = 10000;

public struct CampaignManager has key {
    id: UID,
    campaigns: Table<ID, bool>,
    campaign_count: u64,
    creation_fee: u64,
    collected_fees: Balance<SUI>,
    admins: vector<address>,
}

public struct Campaign<phantom T> has key {
    id: UID,
    name: String,
    description: String,
    image_url: String,
    creator: address,
    goal_amount: u64,
    deadline: u64,
    category: String,
    raised: Balance<T>,
    beneficial_parties: vector<BeneficialParty>,
    total_raised: u64,
    is_active: bool,
    backer_count: u64,
    distributed_amount: u64,
    withdrawn_amount: u64,
}

public struct CampaignOwnerCap has key, store {
    id: UID,
    campaign_id: ID,
}

public struct BeneficialParty has store {
    receiver: address,
    notes: String,
    percentage: u64,
    maximum_amount: u64,
    minimum_amount: u64,
    withdrawn_amount: u64,
}

public struct CampaignCreated has copy, drop {
    campaign_id: ID,
    creator: address,
    name: String,
    goal_amount: u64,
    deadline: u64,
    category: String,
}

public struct DonationReceived has copy, drop {
    campaign_id: ID,
    donor: address,
    amount: u64,
    is_anonymous: bool,
}

public struct FundsWithdrawn has copy, drop {
    campaign_id: ID,
    receiver: address,
    amount: u64,
    is_beneficial_party: bool,
}

public struct FundsDistributed has copy, drop {
    campaign_id: ID,
    amount: u64,
    recipient: address,
}

public struct AdminUpdated has copy, drop {
    admin: address,
    is_added: bool,
}

public struct FeesCollected has copy, drop {
    admin: address,
    amount: u64,
}


fun init(ctx: &mut TxContext) {
    let mut admins = vector::empty();
    vector::push_back(&mut admins, tx_context::sender(ctx));
    
    let campaign_manager = CampaignManager {
        id: object::new(ctx),
        campaigns: table::new(ctx),
        campaign_count: 0,
        creation_fee: 0,
        collected_fees: balance::zero(),
        admins,
    };
    
    transfer::share_object(campaign_manager);
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

public(package) fun is_admin(campaign_manager: &CampaignManager, admin: &address): bool {
    vector::contains(&campaign_manager.admins, admin)
}

public fun add_admin(
    campaign_manager: &mut CampaignManager, 
    admin: address, 
    ctx: &mut TxContext
) {
    assert!(is_admin(campaign_manager, &tx_context::sender(ctx)), ENotAdmin);
    vector::push_back(&mut campaign_manager.admins, admin);
    
    event::emit(AdminUpdated {
        admin,
        is_added: true,
    });
}

public fun remove_admin(
    campaign_manager: &mut CampaignManager,
    admin: address,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(is_admin(campaign_manager, &sender), ENotAdmin);
    assert!(vector::length(&campaign_manager.admins) > 1, ENotAdmin);
    
    let (exists, index) = vector::index_of(&campaign_manager.admins, &admin);
    assert!(exists, ENotAdmin);
    vector::remove(&mut campaign_manager.admins, index);
    
    event::emit(AdminUpdated {
        admin,
        is_added: false,
    });
}

#[allow(lint(self_transfer))]
public fun collect_fees(
    campaign_manager: &mut CampaignManager,
    amount: u64,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(is_admin(campaign_manager, &sender), ENotAdmin);
    assert!(balance::value(&campaign_manager.collected_fees) >= amount, EInsufficientFunds);
    
    let fee_balance = balance::split(&mut campaign_manager.collected_fees, amount);
    let fee_coin = coin::from_balance(fee_balance, ctx);
    
    transfer::public_transfer(fee_coin, sender);
    
    event::emit(FeesCollected {
        admin: sender,
        amount,
    });
}

public fun set_creation_fee(
    campaign_manager: &mut CampaignManager,
    fee: u64,
    ctx: &mut TxContext,
) {
    assert!(is_admin(campaign_manager, &tx_context::sender(ctx)), ENotAdmin);
    campaign_manager.creation_fee = fee;
}

public fun create_beneficial_party(
    receiver: address,
    notes: String,
    percentage: u64,
    maximum_amount: u64,
    minimum_amount: u64,
): BeneficialParty {
    assert!(percentage <= PERCENTAGE_SCALE, EPercentageExceeds100);
    assert!(maximum_amount == 0 || maximum_amount >= minimum_amount, EInvalidBeneficialParties);
    
    BeneficialParty {
        receiver,
        notes,
        percentage,
        maximum_amount,
        minimum_amount,
        withdrawn_amount: 0,
    }
}

public(package) fun validate_beneficial_parties(beneficial_parties: &vector<BeneficialParty>) {
    let mut total_percentage = 0;
    let mut i = 0;
    let len = vector::length(beneficial_parties);
    
    while (i < len) {
        let party = vector::borrow(beneficial_parties, i);
        total_percentage = total_percentage + party.percentage;
        i = i + 1;
    };
    
    assert!(total_percentage <= PERCENTAGE_SCALE, EPercentageExceeds100);
}

#[allow(lint(self_transfer))]
public fun create_campaign<T>(
    campaign_manager: &mut CampaignManager,
    name: String,
    description: String,
    image_url: String,
    category: String,
    goal_amount: u64,
    deadline: u64,
    beneficial_parties: vector<BeneficialParty>,
    creation_fee_coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(deadline > tx_context::epoch(ctx), EFundingDeadlineInPast);
    assert!(goal_amount > 0, EFundingGoalZero);
    validate_beneficial_parties(&beneficial_parties);
    
    let fee_amount = coin::value(&creation_fee_coin);
    assert!(fee_amount >= campaign_manager.creation_fee, EInsufficientFunds);
    
    if (fee_amount > 0) {
        balance::join(&mut campaign_manager.collected_fees, coin::into_balance(creation_fee_coin));
    } else {
        coin::destroy_zero(creation_fee_coin);
    };
    
    let creator = tx_context::sender(ctx);
    let campaign = Campaign<T> {
        id: object::new(ctx),
        name,
        description,
        image_url,
        creator,
        goal_amount,
        deadline,
        category,
        raised: balance::zero(),
        beneficial_parties,
        total_raised: 0,
        is_active: true,
        backer_count: 0,
        distributed_amount: 0,
        withdrawn_amount: 0,
    };
    
    let campaign_id = object::id(&campaign);
    
    let owner_cap = CampaignOwnerCap {
        id: object::new(ctx),
        campaign_id,
    };
    table::add(&mut campaign_manager.campaigns, campaign_id, true);
    campaign_manager.campaign_count = campaign_manager.campaign_count + 1;
    
    event::emit(CampaignCreated {
        campaign_id,
        creator,
        name,
        goal_amount,
        deadline,
        category,
    });
    
    transfer::share_object(campaign);
    
    transfer::transfer(owner_cap, creator);
}

#[allow(lint(self_transfer))]
public fun donate<T>(
    campaign: &mut Campaign<T>,
    donation: Coin<T>,
    message: vector<u8>,
    is_anonymous: bool,
    ctx: &mut TxContext,
) {
    assert!(campaign.is_active, ECampaignNotActive);
    assert!(tx_context::epoch(ctx) <= campaign.deadline, EFundingEnded);
    
    let amount = coin::value(&donation);
    let donor = tx_context::sender(ctx);
    
    campaign.total_raised = campaign.total_raised + amount;
    balance::join(&mut campaign.raised, coin::into_balance(donation));
    campaign.backer_count = campaign.backer_count + 1;
    
    let name = b"SuiGive Donation Receipt";
    let description = b"Proof of donation to a SuiGive campaign";
    let url = b"https://ipfs.io/ipfs/bafkreiap7rugqtnfnw5nlui4aavtrj6zrqbxzzanq44sxnztktm3kzdufi";
    
    let receipt = donation_receipt::mint(
        object::id_address(campaign),
        donor,
        amount,
        message,
        is_anonymous,
        name,
        description,
        url,
        ctx
    );
    
    donation_receipt::transfer_receipt(receipt, donor);
    
    event::emit(DonationReceived {
        campaign_id: object::id(campaign),
        donor,
        amount,
        is_anonymous,
    });
}

public fun is_goal_reached<T>(campaign: &Campaign<T>): bool {
    campaign.total_raised >= campaign.goal_amount
}

public fun is_campaign_ended<T>(campaign: &Campaign<T>, ctx: &TxContext): bool {
    tx_context::epoch(ctx) > campaign.deadline
}

public(package) fun calculate_party_amount(party: &BeneficialParty, total_raised: u64, is_successful: bool): u64 {
    let calculated_amount = if (is_successful) {
        (total_raised * party.percentage) / PERCENTAGE_SCALE
    } else {
        party.minimum_amount
    };
    
    if (party.maximum_amount > 0 && calculated_amount > party.maximum_amount) {
        party.maximum_amount
    } else {
        calculated_amount
    }
}

public fun withdraw_for_party<T>(
    campaign: &mut Campaign<T>,
    owner_cap: &CampaignOwnerCap,
    party_index: u64,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.campaign_id == object::id(campaign), ENotFundOwner);
    
    let is_successful = is_goal_reached(campaign);
    let campaign_id = object::id(campaign);
    
    let party = vector::borrow_mut(&mut campaign.beneficial_parties, party_index);
    let amount_due = calculate_party_amount(party, campaign.total_raised, is_successful);
    let withdrawable = amount_due - party.withdrawn_amount;
    
    assert!(withdrawable > 0, EAlreadyWithdrawn);
    assert!(balance::value(&campaign.raised) >= withdrawable, EInsufficientFunds);
    
    party.withdrawn_amount = party.withdrawn_amount + withdrawable;
    campaign.withdrawn_amount = campaign.withdrawn_amount + withdrawable;
    
    let withdrawal = balance::split(&mut campaign.raised, withdrawable);
    let withdrawal_coin = coin::from_balance(withdrawal, ctx);
    transfer::public_transfer(withdrawal_coin, party.receiver);
    
    event::emit(FundsWithdrawn {
        campaign_id,
        receiver: party.receiver,
        amount: withdrawable,
        is_beneficial_party: true,
    });
}

public fun withdraw_remaining<T>(
    campaign: &mut Campaign<T>,
    owner_cap: &CampaignOwnerCap,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.campaign_id == object::id(campaign), ENotFundOwner);
    
    let available = balance::value(&campaign.raised);
    assert!(available > 0, EInsufficientFunds);
    
    let mut total_party_amount = 0;
    let is_successful = is_goal_reached(campaign);
    let mut i = 0;
    let len = vector::length(&campaign.beneficial_parties);
    
    while (i < len) {
        let party = vector::borrow(&campaign.beneficial_parties, i);
        total_party_amount = total_party_amount + calculate_party_amount(party, campaign.total_raised, is_successful);
        i = i + 1;
    };
    
    let creator_amount = if (campaign.total_raised > total_party_amount) {
        campaign.total_raised - total_party_amount
    } else {
        0
    };
    
    let withdrawable = if (available < creator_amount) available else creator_amount;
    assert!(withdrawable > 0, EInsufficientFunds);
    
    campaign.withdrawn_amount = campaign.withdrawn_amount + withdrawable;
    
    let withdrawal = balance::split(&mut campaign.raised, withdrawable);
    let withdrawal_coin = coin::from_balance(withdrawal, ctx);
    transfer::public_transfer(withdrawal_coin, campaign.creator);
    
    event::emit(FundsWithdrawn {
        campaign_id: object::id(campaign),
        receiver: campaign.creator,
        amount: withdrawable,
        is_beneficial_party: false,
    });
}

public fun distribute_funds(
    campaign: &mut Campaign<SUI>,
    owner_cap: &CampaignOwnerCap,
    treasury: &mut SgSuiTreasury,
    minter_cap: &mut SgSuiMinterCap,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.campaign_id == object::id(campaign), ENotFundOwner);
    assert!(balance::value(&campaign.raised) >= amount, EInsufficientFunds);
    
    let extracted_balance = balance::split(&mut campaign.raised, amount);
    let extracted_coin = coin::from_balance(extracted_balance, ctx);
    
    campaign.distributed_amount = campaign.distributed_amount + amount;
    
    sg_sui_token::add_funds_and_mint(
        treasury,
        minter_cap,
        extracted_coin,
        recipient,
        object::id_address(campaign),
        ctx
    );
    
    event::emit(FundsDistributed {
        campaign_id: object::id(campaign),
        amount,
        recipient,
    });
}

public fun get_campaign_details<T>(campaign: &Campaign<T>): (
    String, String, String, address, u64, u64, String, u64, bool, u64
) {
    (
        campaign.name,
        campaign.description,
        campaign.image_url,
        campaign.creator,
        campaign.goal_amount,
        campaign.deadline,
        campaign.category,
        campaign.total_raised,
        campaign.is_active,
        campaign.backer_count
    )
}

public fun get_campaign_balance<T>(campaign: &Campaign<T>): u64 {
    balance::value(&campaign.raised)
}

public fun get_beneficial_party(campaign: &Campaign<SUI>, index: u64): &BeneficialParty {
    vector::borrow(&campaign.beneficial_parties, index)
}

public fun get_beneficial_parties_count<T>(campaign: &Campaign<T>): u64 {
    vector::length(&campaign.beneficial_parties)
}

public fun is_campaign_owner<T>(campaign: &Campaign<T>, owner_cap: &CampaignOwnerCap): bool {
    object::id(campaign) == owner_cap.campaign_id
}

#[test_only]
/// Test-only function that creates a campaign and returns the owner capability
/// instead of transferring it. This is needed because tests expect to receive
/// the owner cap to perform subsequent operations.
public fun create_campaign_for_testing<T>(
    campaign_manager: &mut CampaignManager,
    name: String,
    description: String,
    image_url: String,
    category: String,
    goal_amount: u64,
    deadline: u64,
    beneficial_parties: vector<BeneficialParty>,
    ctx: &mut TxContext,
): CampaignOwnerCap {
    let zero_coin = coin::zero<SUI>(ctx);
    create_campaign_with_parties_for_testing<T>(
        campaign_manager,
        name,
        description,
        image_url,
        category,
        goal_amount,
        deadline,
        beneficial_parties,
        zero_coin,
        ctx
    )
}

#[test_only]
/// Test-only helper that duplicates the campaign creation logic but returns
/// the owner capability instead of transferring it. This allows tests to
/// manage the capability directly.
public fun create_campaign_with_parties_for_testing<T>(
    campaign_manager: &mut CampaignManager,
    name: String,
    description: String,
    image_url: String,
    category: String,
    goal_amount: u64,
    deadline: u64,
    beneficial_parties: vector<BeneficialParty>,
    creation_fee_coin: Coin<SUI>,
    ctx: &mut TxContext,
): CampaignOwnerCap {
    assert!(deadline > tx_context::epoch(ctx), EFundingDeadlineInPast);
    assert!(goal_amount > 0, EFundingGoalZero);
    validate_beneficial_parties(&beneficial_parties);

    let fee_amount = coin::value(&creation_fee_coin);
    assert!(fee_amount >= campaign_manager.creation_fee, EInsufficientFunds);

    if (fee_amount > 0) {
        balance::join(&mut campaign_manager.collected_fees, coin::into_balance(creation_fee_coin));
    } else {
        coin::destroy_zero(creation_fee_coin);
    };

    let creator = tx_context::sender(ctx);
    let campaign = Campaign<T> {
        id: object::new(ctx),
        name,
        description,
        image_url,
        creator,
        goal_amount,
        deadline,
        category,
        raised: balance::zero(),
        beneficial_parties,
        total_raised: 0,
        is_active: true,
        backer_count: 0,
        distributed_amount: 0,
        withdrawn_amount: 0,
    };

    let campaign_id = object::id(&campaign);

    let owner_cap = CampaignOwnerCap {
        id: object::new(ctx),
        campaign_id,
    };
    
    table::add(&mut campaign_manager.campaigns, campaign_id, true);
    campaign_manager.campaign_count = campaign_manager.campaign_count + 1;

    event::emit(CampaignCreated {
        campaign_id,
        creator,
        name,
        goal_amount,
        deadline,
        category,
    });

    transfer::share_object(campaign);
    
    owner_cap
}