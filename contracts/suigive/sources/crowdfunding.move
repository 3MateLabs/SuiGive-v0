// SuiGive Crowdfunding Smart Contract
// A decentralized crowdfunding platform built on Sui blockchain
module suigive::crowdfunding;

use std::string::String;
use sui::balance::{Self, Balance};
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use sui::table as table;

// === Structs ===

// our offical address, tba
const DEFAULT_MANAGER_BENEFICIAL_ADDRESS: address =
    @0x0000000000000000000000000000000000000000000000000000000000000000;

public struct CampaignManager has key, store {
    id: UID,
    campaigns: table::Table<u64, ID>,
    creation_fee_in_sui: u64,
    collected_fees: Balance<SUI>,
    admins: vector<address>, // maybe admin cap will work
    beneficial_address: address,
    minimum_donation_amount: u64,
}

/// Represents a crowdfunding campaign
public struct Campaign<phantom T> has key, store {
    id: UID,
    raised: Balance<T>,
    beneficial_parties: vector<BeneficialParty>,
    name: String,
    creator: address,
    description: String,
    image_url: String,
    category: String,
    total_raised: u64,
    goal_amount: u64,
    deadline: u64,
    is_active: bool,
    backer_count: u64,
    // Track distributed funds for closed-loop tokens
    distributed_amount: u64,
    // Track total amount of funds withdrawn
    withdrawn_amount: u64,
    withdrawn_beneficiary_parties_index: vector<u64>,
}

public struct BeneficialParty has store {
    receiver: address,
    notes: String,
    percentage: u64, // total is 10000, and like if we set 100 here, mean 1%
    maximum_amount: u64, // the maximum amount this beneficial party will get, optional, if set to 0 will mean no max
    minimum_amount: u64, // the minimum value will get even campaign fail
    withdrawn_amount: u64,
}

// todo may need to turn this into a nft?
public struct Receipt has key, store {
    id: UID,
    campaign_id: ID,
    donation_amount: u64,
    timestamp: u64,
    is_valid: bool,
}

// logic for campaign manager

fun init(ctx: &mut TxContext) {
    let mut admins = vector::empty();
    vector::push_back(&mut admins, ctx.sender());
    let campaign_manager = CampaignManager {
        id: object::new(ctx),
        campaigns: table::new(ctx),
        admins,
        creation_fee_in_sui: 0,
        collected_fees: balance::zero(),
        beneficial_address: DEFAULT_MANAGER_BENEFICIAL_ADDRESS,
        minimum_donation_amount: 0,
    };
    transfer::share_object(campaign_manager);
}

fun is_admin(campaign_manager: &CampaignManager, admin: &address): bool {
    campaign_manager.admins.contains(admin)
}

public fun add_admin(campaign_manager: &mut CampaignManager, admin: address, ctx: &mut TxContext) {
    assert!(is_admin(campaign_manager, &ctx.sender()), 0); // todo code TBA
    vector::push_back(&mut campaign_manager.admins, admin);
}

public fun remove_admin(
    campaign_manager: &mut CampaignManager,
    admin: address,
    ctx: &mut TxContext,
) {
    assert!(is_admin(campaign_manager, &ctx.sender()) && campaign_manager.admins.length() > 1, 0);
    let (_, index) = campaign_manager.admins.index_of(&admin);
    campaign_manager.admins.remove(index);
}

public fun set_beneficial_address(
    campaign_manager: &mut CampaignManager,
    beneficial_address: address,
    ctx: &mut TxContext,
) {
    assert!(is_admin(campaign_manager, &ctx.sender()), 0); // todo code TBA
    campaign_manager.beneficial_address = beneficial_address;
}

public fun admin_collect_fees(
    campaign_manager: &mut CampaignManager,
    amount: u64,
    ctx: &mut TxContext,
): coin::Coin<SUI> {
    assert!(is_admin(campaign_manager, &ctx.sender()), 0); // todo code TBA
    let fee_balance = campaign_manager.collected_fees.split(amount);
    coin::from_balance(fee_balance, ctx)
}

// logic for beneficial parties

public fun create_beneficial_party(
    receiver: address,
    notes: String,
    percentage: u64,
    maximum_amount: u64,
    minimum_amount: u64,
): BeneficialParty {
    assert!(percentage <= 10000, 0); // Percentage cannot exceed 100%
    assert!(minimum_amount <= maximum_amount, 0); // Minimum amount cannot exceed maximum amount
    BeneficialParty {
        receiver,
        notes,
        percentage,
        maximum_amount,
        minimum_amount,
        withdrawn_amount: 0,
    }
}

fun is_beneficial_party_include_manager(
    campaign_manager: &CampaignManager,
    beneficial_parties: &vector<BeneficialParty>,
): bool {
    let mut index = 0;
    while (index < beneficial_parties.length()) {
        if (
            beneficial_parties[index].receiver == campaign_manager.beneficial_address && 
            beneficial_parties[index].minimum_amount > campaign_manager.minimum_donation_amount
        ) {
            return true
        };
        index = index + 1;
    };
    false
}

public fun create_campaign<T>(
    campaign_manager: &mut CampaignManager,
    fee: coin::Coin<SUI>,
    name: String,
    description: String,
    image_url: String,
    category: String,
    creator: address,
    beneficial_parties: vector<BeneficialParty>,
    goal_amount: u64,
    deadline: u64,
    ctx: &mut TxContext,
) {
    assert!(coin::value(&fee) == campaign_manager.creation_fee_in_sui, 0); // todo code TBA
    assert!(is_beneficial_party_include_manager(campaign_manager, &beneficial_parties), 0); // todo code TBA
    campaign_manager.collected_fees.join(coin::into_balance(fee));
    let campaign = Campaign<T> {
        id: object::new(ctx),
        raised: balance::zero(),
        beneficial_parties,
        name,
        creator,
        description,
        image_url,
        category,
        total_raised: 0,
        goal_amount,
        deadline,
        is_active: true,
        backer_count: 0,
        distributed_amount: 0,
        withdrawn_amount: 0,
        withdrawn_beneficiary_parties_index: vector::empty(),
    };
    transfer::share_object(campaign);
}

public fun donate<T>(
    campaign: &mut Campaign<T>,
    coin_to_donate: coin::Coin<T>,
    clock: &clock::Clock,
    ctx: &mut TxContext,
): Receipt {
    // todo assertions
    let donation_amount = coin::value(&coin_to_donate);
    campaign.total_raised = campaign.total_raised + donation_amount;
    campaign.raised.join(coin::into_balance(coin_to_donate));
    campaign.backer_count = campaign.backer_count + 1;

    // todo: emit event
    // todo: return receipt
    Receipt {
        id: object::new(ctx),
        campaign_id: object::id(campaign),
        donation_amount,
        timestamp: clock.timestamp_ms(),
        is_valid: true,
    }
}

public fun is_reached_goal<T>(campaign: &Campaign<T>): bool {
    campaign.total_raised >= campaign.goal_amount
}

// function to end campaign

public fun creator_end_campaign<T>(campaign: &mut Campaign<T>, ctx: &TxContext) {
    assert!(campaign.creator == ctx.sender(), 0); // todo code TBA
    assert!(campaign.is_active, 0); // todo code TBA
    assert!(is_reached_goal(campaign), 0); // todo code TBA
    campaign.is_active = false;
    // todo: emit event
}

public fun end_campaign_by_deadline<T>(
    campaign_manager: &CampaignManager,
    campaign: &mut Campaign<T>,
    clock: &clock::Clock,
    ctx: &TxContext,
) {
    assert!(
        is_admin(campaign_manager, &ctx.sender()) || 
        campaign.creator == ctx.sender(),
        0, // todo code TBA
    );
    assert!(campaign.is_active, 0); // todo code TBA
    assert!(campaign.deadline < clock.timestamp_ms(), 0); // todo code TBA
    campaign.is_active = false;
    // todo: emit event
}

// function if success

// can withdrawn to a close loop token to track distribution, but that will be a standalone smart contract
public fun beneficiary_party_withdraw<T>(
    campaign: &mut Campaign<T>,
    beneficiary_party_index: u64,
    withdraw_amount: u64,
    _notes: String,
    ctx: &mut TxContext,
): coin::Coin<T> {
    assert!(!campaign.is_active, 0); // todo code TBA
    assert!(is_reached_goal(campaign), 0); // todo code TBA
    let beneficiary_party = campaign.beneficial_parties.borrow_mut(beneficiary_party_index);
    assert!(beneficiary_party.receiver == ctx.sender(), 0); // todo code TBA
    beneficiary_party.withdrawn_amount = beneficiary_party.withdrawn_amount + withdraw_amount;

    // logic to make sure the beneficiary party not exceed the maximum amount
    assert!(beneficiary_party.withdrawn_amount <= beneficiary_party.maximum_amount, 0); // todo code TBA
    let max_withdrawable = (campaign.total_raised * beneficiary_party.percentage) / 10000;
    assert!(beneficiary_party.withdrawn_amount <= max_withdrawable, 0); // Cannot withdraw more than percentage allows

    // todo: emit event with notes
    // return coin
    coin::from_balance(campaign.raised.split(withdraw_amount), ctx)
}

// function if fail

public fun distribute_minimum_funds_to_beneficiary_parties_when_fail<T>(
    campaign: &mut Campaign<T>,
    ctx: &mut TxContext,
) {
    assert!(!campaign.is_active, 0); // todo code TBA
    assert!(!is_reached_goal(campaign), 0); // todo code TBA
    let mut index = 0;
    while (index < campaign.beneficial_parties.length()) {
        let beneficiary_party = campaign.beneficial_parties.borrow_mut(index);
        let amount_to_withdraw = (
            beneficiary_party.minimum_amount - beneficiary_party.withdrawn_amount,
        );
        beneficiary_party.withdrawn_amount =
            beneficiary_party.withdrawn_amount + 
            amount_to_withdraw;
        campaign.distributed_amount = campaign.distributed_amount + amount_to_withdraw;
        let balance_to_withdraw = campaign.raised.split(beneficiary_party.minimum_amount);
        let coin_to_withdraw = coin::from_balance(balance_to_withdraw, ctx);
        transfer::public_transfer(coin_to_withdraw, beneficiary_party.receiver);
        vector::push_back(&mut campaign.withdrawn_beneficiary_parties_index, index);
        index = index + 1;
    };
    // todo: emit event
    // todo: return receipt
}

public fun donator_claim_back_donation<T>(
    campaign: &mut Campaign<T>,
    receipt: &mut Receipt,
    ctx: &mut TxContext,
): coin::Coin<T> {
    // todo: assertion, add it
    let ratio_after_minimum_funds_distributed =
        (
        campaign.total_raised - campaign.distributed_amount
    ) * 10000/ campaign.total_raised;
    let amount_to_claim =
        (
        receipt.donation_amount * ratio_after_minimum_funds_distributed
    ) / 10000;
    let balance_to_claim = campaign.raised.split(amount_to_claim);
    receipt.is_valid = false;
    // emit event
    coin::from_balance(balance_to_claim, ctx)
}
