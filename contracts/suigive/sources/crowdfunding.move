// SuiGive Crowdfunding Smart Contract
// A decentralized crowdfunding platform built on Sui blockchain
module suigive::crowdfunding;

use std::string::{Self, String};
// vector is already available by default
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
// object, ID, and UID are already available by default
use sui::sui::SUI;
use sui::table::{Self, Table};
// transfer is already available by default
// TxContext is already available by default
use suigive::donation_receipt;
use suigive::sg_sui_token::{Self, SgSuiTreasury, SgSuiMinterCap};
use suigive::sg_usd::SG_USD;

// === Errors ===
const EFundingDeadlineInPast: u64 = 1;
const EFundingGoalZero: u64 = 2;
// Removed unused constants
const ENotFundOwner: u64 = 5;
const EFundingEnded: u64 = 6;
const EInsufficientFunds: u64 = 7;
const ENotAdmin: u64 = 8;
const EPercentageExceeds100: u64 = 9;
const ECampaignNotActive: u64 = 10;
const EInvalidBeneficialParties: u64 = 11;
const EAlreadyWithdrawn: u64 = 12;

// === Constants ===
const PERCENTAGE_SCALE: u64 = 10000; // 100% = 10000, 1% = 100, 0.01% = 1

// === Structs ===

/// Global manager for all campaigns
public struct CampaignManager has key {
    id: UID,
    campaigns: Table<ID, bool>, // Track all campaign IDs
    campaign_count: u64,
    creation_fee: u64,
    collected_fees: Balance<SUI>,
    admins: vector<address>,
}

/// Represents a crowdfunding campaign
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

/// Capability for campaign owners
public struct CampaignOwnerCap has key, store {
    id: UID,
    campaign_id: ID,
}

/// Represents a party that receives a portion of campaign funds
public struct BeneficialParty has store {
    receiver: address,
    notes: String,
    percentage: u64, // Out of 10000 (e.g., 100 = 1%)
    maximum_amount: u64, // Max amount this party can receive (0 = no limit)
    minimum_amount: u64, // Min amount guaranteed even if campaign fails
    withdrawn_amount: u64,
}

// === Events ===

/// Emitted when a campaign is created
public struct CampaignCreated has copy, drop {
    campaign_id: ID,
    creator: address,
    name: String,
    goal_amount: u64,
    deadline: u64,
    category: String,
}

/// Emitted when a donation is made
public struct DonationReceived has copy, drop {
    campaign_id: ID,
    donor: address,
    amount: u64,
    token_type: String,
    is_anonymous: bool,
}

/// Emitted when funds are withdrawn
public struct FundsWithdrawn has copy, drop {
    campaign_id: ID,
    receiver: address,
    amount: u64,
    token_type: String,
    is_beneficial_party: bool,
}

/// Emitted when funds are distributed using sgSUI tokens
public struct FundsDistributed has copy, drop {
    campaign_id: ID,
    amount: u64,
    recipient: address,
}

/// Emitted when admin is added/removed
public struct AdminUpdated has copy, drop {
    admin: address,
    is_added: bool,
}

/// Emitted when fees are collected
public struct FeesCollected has copy, drop {
    admin: address,
    amount: u64,
}

// === Module Initialization ===

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
/// Initialize function for testing
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

// === Admin Management Functions ===

/// Check if an address is an admin
fun is_admin(campaign_manager: &CampaignManager, admin: &address): bool {
    vector::contains(&campaign_manager.admins, admin)
}

/// Add a new admin (admin only)
public entry fun add_admin(
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

/// Remove an admin (admin only, must have at least one admin remaining)
public entry fun remove_admin(
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

/// Collect accumulated fees (admin only)
public entry fun collect_fees(
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

/// Set creation fee (admin only)
public entry fun set_creation_fee(
    campaign_manager: &mut CampaignManager,
    fee: u64,
    ctx: &mut TxContext,
) {
    assert!(is_admin(campaign_manager, &tx_context::sender(ctx)), ENotAdmin);
    campaign_manager.creation_fee = fee;
}

// === Beneficial Party Functions ===

/// Create a beneficial party for fund distribution
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

/// Validate that total percentages don't exceed 100%
fun validate_beneficial_parties(beneficial_parties: &vector<BeneficialParty>) {
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

// === Campaign Management Functions ===

/// Create a new campaign (anyone can create, with fee if set)
public entry fun create_campaign<T>(
    campaign_manager: &mut CampaignManager,
    name: String,
    description: String,
    image_url: String,
    category: String,
    goal_amount: u64,
    deadline: u64,
    creation_fee_coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    // Create empty beneficial parties vector for basic campaigns
    let beneficial_parties = vector::empty<BeneficialParty>();
    let owner_cap = create_campaign_with_parties<T>(
        campaign_manager,
        name,
        description,
        image_url,
        category,
        goal_amount,
        deadline,
        beneficial_parties,
        creation_fee_coin,
        ctx
    );
    
    // Transfer owner capability to creator
    transfer::transfer(owner_cap, tx_context::sender(ctx));
}

/// Create a new campaign with beneficial parties (internal function)
public fun create_campaign_with_parties<T>(
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
    // Validate inputs
    assert!(deadline > tx_context::epoch(ctx), EFundingDeadlineInPast);
    assert!(goal_amount > 0, EFundingGoalZero);
    validate_beneficial_parties(&beneficial_parties);
    
    // Check creation fee
    let fee_amount = coin::value(&creation_fee_coin);
    assert!(fee_amount >= campaign_manager.creation_fee, EInsufficientFunds);
    
    // Add fee to collected fees
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
    
    // Create and transfer owner capability
    let owner_cap = CampaignOwnerCap {
        id: object::new(ctx),
        campaign_id,
    };
    // Register campaign in manager
    table::add(&mut campaign_manager.campaigns, campaign_id, true);
    campaign_manager.campaign_count = campaign_manager.campaign_count + 1;
    
    // Emit event
    event::emit(CampaignCreated {
        campaign_id,
        creator,
        name,
        goal_amount,
        deadline,
        category,
    });
    
    // Share the campaign object
    transfer::share_object(campaign);
    
    // Return the owner capability
    owner_cap
}

/// Donate to a campaign with NFT receipt
public entry fun donate<T>(
    campaign: &mut Campaign<T>,
    donation: Coin<T>,
    message: vector<u8>,
    is_anonymous: bool,
    ctx: &mut TxContext,
) {
    // Validate campaign is active and not ended
    assert!(campaign.is_active, ECampaignNotActive);
    assert!(tx_context::epoch(ctx) <= campaign.deadline, EFundingEnded);
    
    let amount = coin::value(&donation);
    let donor = tx_context::sender(ctx);
    
    // Add donation to campaign
    campaign.total_raised = campaign.total_raised + amount;
    balance::join(&mut campaign.raised, coin::into_balance(donation));
    campaign.backer_count = campaign.backer_count + 1;
    
    // Create donation receipt NFT
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
    
    // Determine token type for event
    let token_type = if (std::type_name::get<T>() == std::type_name::get<SUI>()) {
        string::utf8(b"SUI")
    } else if (std::type_name::get<T>() == std::type_name::get<SG_USD>()) {
        string::utf8(b"sgUSD")
    } else {
        string::utf8(b"Unknown")
    };
    
    // Emit event
    event::emit(DonationReceived {
        campaign_id: object::id(campaign),
        donor,
        amount,
        token_type,
        is_anonymous,
    });
}

/// Check if campaign has reached its goal
public fun is_goal_reached<T>(campaign: &Campaign<T>): bool {
    campaign.total_raised >= campaign.goal_amount
}

/// Check if campaign has ended
public fun is_campaign_ended<T>(campaign: &Campaign<T>, ctx: &TxContext): bool {
    tx_context::epoch(ctx) > campaign.deadline
}

/// Calculate amount due to a beneficial party
fun calculate_party_amount(party: &BeneficialParty, total_raised: u64, is_successful: bool): u64 {
    let calculated_amount = if (is_successful) {
        // Calculate percentage of total raised
        (total_raised * party.percentage) / PERCENTAGE_SCALE
    } else {
        // For failed campaigns, only guarantee minimum
        party.minimum_amount
    };
    
    // Apply maximum cap if set
    if (party.maximum_amount > 0 && calculated_amount > party.maximum_amount) {
        party.maximum_amount
    } else {
        calculated_amount
    }
}

/// Withdraw funds for beneficial parties
public entry fun withdraw_for_party<T>(
    campaign: &mut Campaign<T>,
    owner_cap: &CampaignOwnerCap,
    party_index: u64,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(owner_cap.campaign_id == object::id(campaign), ENotFundOwner);
    
    // Calculate amounts first
    let is_successful = is_goal_reached(campaign);
    let campaign_id = object::id(campaign);
    
    let party = vector::borrow_mut(&mut campaign.beneficial_parties, party_index);
    let amount_due = calculate_party_amount(party, campaign.total_raised, is_successful);
    let withdrawable = amount_due - party.withdrawn_amount;
    
    assert!(withdrawable > 0, EAlreadyWithdrawn);
    assert!(balance::value(&campaign.raised) >= withdrawable, EInsufficientFunds);
    
    // Update withdrawn amount
    party.withdrawn_amount = party.withdrawn_amount + withdrawable;
    campaign.withdrawn_amount = campaign.withdrawn_amount + withdrawable;
    
    // Transfer funds
    let withdrawal = balance::split(&mut campaign.raised, withdrawable);
    let withdrawal_coin = coin::from_balance(withdrawal, ctx);
    transfer::public_transfer(withdrawal_coin, party.receiver);
    
    // Determine token type for event
    let token_type = if (std::type_name::get<T>() == std::type_name::get<SUI>()) {
        string::utf8(b"SUI")
    } else if (std::type_name::get<T>() == std::type_name::get<SG_USD>()) {
        string::utf8(b"sgUSD")
    } else {
        string::utf8(b"Unknown")
    };
    
    // Emit event
    event::emit(FundsWithdrawn {
        campaign_id,
        receiver: party.receiver,
        amount: withdrawable,
        token_type,
        is_beneficial_party: true,
    });
}

/// Withdraw remaining funds for campaign creator
public entry fun withdraw_remaining<T>(
    campaign: &mut Campaign<T>,
    owner_cap: &CampaignOwnerCap,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(owner_cap.campaign_id == object::id(campaign), ENotFundOwner);
    
    let available = balance::value(&campaign.raised);
    assert!(available > 0, EInsufficientFunds);
    
    // Calculate total amount owed to beneficial parties
    let mut total_party_amount = 0;
    let is_successful = is_goal_reached(campaign);
    let mut i = 0;
    let len = vector::length(&campaign.beneficial_parties);
    
    while (i < len) {
        let party = vector::borrow(&campaign.beneficial_parties, i);
        total_party_amount = total_party_amount + calculate_party_amount(party, campaign.total_raised, is_successful);
        i = i + 1;
    };
    
    // Remaining amount for creator
    let creator_amount = if (campaign.total_raised > total_party_amount) {
        campaign.total_raised - total_party_amount
    } else {
        0
    };
    
    // Ensure we don't withdraw more than available
    let withdrawable = if (available < creator_amount) available else creator_amount;
    assert!(withdrawable > 0, EInsufficientFunds);
    
    campaign.withdrawn_amount = campaign.withdrawn_amount + withdrawable;
    
    // Transfer funds to creator
    let withdrawal = balance::split(&mut campaign.raised, withdrawable);
    let withdrawal_coin = coin::from_balance(withdrawal, ctx);
    transfer::public_transfer(withdrawal_coin, campaign.creator);
    
    // Determine token type for event
    let token_type = if (std::type_name::get<T>() == std::type_name::get<SUI>()) {
        string::utf8(b"SUI")
    } else if (std::type_name::get<T>() == std::type_name::get<SG_USD>()) {
        string::utf8(b"sgUSD")
    } else {
        string::utf8(b"Unknown")
    };
    
    // Emit event
    event::emit(FundsWithdrawn {
        campaign_id: object::id(campaign),
        receiver: campaign.creator,
        amount: withdrawable,
        token_type,
        is_beneficial_party: false,
    });
}

/// Distribute funds using sgSUI tokens (for SUI campaigns only)
public entry fun distribute_funds(
    campaign: &mut Campaign<SUI>,
    owner_cap: &CampaignOwnerCap,
    treasury: &mut SgSuiTreasury,
    minter_cap: &mut SgSuiMinterCap,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    // Verify ownership
    assert!(owner_cap.campaign_id == object::id(campaign), ENotFundOwner);
    assert!(balance::value(&campaign.raised) >= amount, EInsufficientFunds);
    
    // Extract funds from campaign
    let extracted_balance = balance::split(&mut campaign.raised, amount);
    let extracted_coin = coin::from_balance(extracted_balance, ctx);
    
    // Update distributed amount
    campaign.distributed_amount = campaign.distributed_amount + amount;
    
    // Add funds to treasury and mint sgSUI tokens
    sg_sui_token::add_funds_and_mint(
        treasury,
        minter_cap,
        extracted_coin,
        recipient,
        object::id_address(campaign),
        ctx
    );
    
    // Emit event
    event::emit(FundsDistributed {
        campaign_id: object::id(campaign),
        amount,
        recipient,
    });
}

// === View Functions ===

/// Get campaign details
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

/// Get campaign balance
public fun get_campaign_balance<T>(campaign: &Campaign<T>): u64 {
    balance::value(&campaign.raised)
}

/// Get beneficial party details
public fun get_beneficial_party(campaign: &Campaign<SUI>, index: u64): &BeneficialParty {
    vector::borrow(&campaign.beneficial_parties, index)
}

/// Get number of beneficial parties
public fun get_beneficial_parties_count<T>(campaign: &Campaign<T>): u64 {
    vector::length(&campaign.beneficial_parties)
}

/// Check campaign ownership
public fun is_campaign_owner<T>(campaign: &Campaign<T>, owner_cap: &CampaignOwnerCap): bool {
    object::id(campaign) == owner_cap.campaign_id
}

#[test_only]
/// Create campaign for testing without fees
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
    create_campaign_with_parties<T>(
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