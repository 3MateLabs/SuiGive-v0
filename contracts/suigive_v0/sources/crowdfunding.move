// SuiGive Crowdfunding Smart Contract
// A decentralized crowdfunding platform built on Sui blockchain
module suigive::crowdfunding;

use std::string::{Self, String};
use std::vector;
use sui::balance::{Self, Balance};
use sui::coin;
use sui::event;
use sui::object;
use sui::sui::SUI;
use sui::table as table;
use sui::transfer;
use sui::tx_context;
use suigive::donation_receipt;
use suigive::sg_sui_token::{Self, SgSuiTreasury, SgSuiMinterCap};
use suigive::sg_usd::{Self, SG_USD};

// === Errors ===
const EFundingDeadlineInPast: u64 = 1;
const EFundingGoalZero: u64 = 2;
const EFundingNotEnded: u64 = 3;
const EFundingGoalNotReached: u64 = 4;
const ENotFundOwner: u64 = 5;
const EFundingEnded: u64 = 6;
const EInsufficientFunds: u64 = 7;

// === Structs ===

public struct CampaignManager has key, store {
    id: UID,
    campaigns: table::Table<u64, ID>,
    creation_fee_in_sui: u64,
    collected_fees: Balance<SUI>,
    admins: vector<address>, // maybe admin cap will work
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
}

public struct BeneficialParty has store {
    receiver: address,
    notes: String,
    percentage: u64, // total is 10000, and like if we set 100 here, mean 1%
    maximum_amount: u64, // the maximum amount this beneficial party will get, optional, if set to 0 will mean no max
    minimum_amount: u64, // the minimum value will get even campaign fail
    withdrawn_amount: u64,
}

// logic for campaign manager

fun init(ctx: &mut TxContext) {
    let admins = vector::empty();
    vector::push_back(&mut admins, ctx.sender());
    let campaign_manager = CampaignManager {
        id: object::new(ctx),
        campaigns: table::new(ctx),
        admins,
        creation_fee_in_sui: 0,
        collected_fees: balance::zero(),
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
    BeneficialParty {
        receiver,
        notes,
        percentage,
        maximum_amount,
        minimum_amount,
        withdrawn_amount: 0,
    }
}

public fun create_campaign<T>(
    ctx: &mut TxContext,
    name: String,
    description: String,
    image_url: String,
    category: String,
    goal_amount: u64,
    deadline: u64,
    creator: address,
    beneficial_parties: vector<BeneficialParty>,
) {
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
    };
    transfer::share_object(campaign);
}

public fun donate<T>(
    campaign: &mut Campaign<T>,
    coin_to_donate: coin::Coin<T>,
    _ctx: &mut TxContext,
) {
    // todo assertions
    campaign.total_raised = campaign.total_raised + coin_to_donate.value();
    campaign.raised.join(coin::into_balance(coin_to_donate));
    campaign.backer_count = campaign.backer_count + 1;

    // todo: emit eventaddress
    // todo: return receipt
}

public fun is_reached_goal<T>(campaign: &Campaign<T>): bool {
    campaign.total_raised >= campaign.goal_amount
}

// function if success
