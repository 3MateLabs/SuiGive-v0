// SuiGive Crowdfunding Smart Contract
// A decentralized crowdfunding platform built on Sui blockchain
module suigive::crowdfunding {
    // === Imports ===
    use sui::object;
    use sui::coin;
    use sui::balance;
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context;
    use sui::event;
    use sui::table;
    use std::string::String;
    use std::vector;
    
    // === Errors ===
    const EFundingDeadlineInPast: u64 = 1;
    const EFundingGoalZero: u64 = 2;
    const EFundingNotEnded: u64 = 3;
    const EFundingGoalNotReached: u64 = 4;
    const ENotFundOwner: u64 = 5;
    const EFundingEnded: u64 = 6;

    // === Structs ===
    /// Represents a crowdfunding campaign
    public struct Campaign has key, store {
        id: object::UID,
        name: String,
        description: String,
        image_url: String,
        creator: address,
        goal_amount: u64,
        deadline: u64,
        category: String,
        raised: balance::Balance<SUI>,
        is_active: bool,
        backer_count: u64,
    }

    /// Capability given to the campaign creator to withdraw funds
    public struct CampaignOwnerCap has key, store {
        id: object::UID,
        campaign_id: object::ID,
    }

    /// Receipt given to donors as proof of donation
    public struct DonationReceipt has key, store {
        id: object::UID,
        campaign_id: object::ID,
        donor: address,
        amount: u64,
        timestamp: u64,
        is_anonymous: bool,
    }

    /// Registry to track all campaigns
    public struct Registry has key {
        id: object::UID,
        campaigns: vector<object::ID>,
        campaigns_by_category: table::Table<String, vector<object::ID>>,
    }

    // === Events ===
    /// Emitted when a new campaign is created
    public struct CampaignCreated has copy, drop {
        campaign_id: object::ID,
        creator: address,
        name: String,
        goal_amount: u64,
        deadline: u64,
    }

    /// Emitted when a donation is made
    public struct DonationReceived has copy, drop {
        campaign_id: object::ID,
        donor: address,
        amount: u64,
        is_anonymous: bool,
    }

    /// Emitted when funds are withdrawn by the campaign creator
    public struct FundsWithdrawn has copy, drop {
        campaign_id: object::ID,
        amount: u64,
        recipient: address,
    }

    // === Module Initialization ===
    fun init(ctx: &mut tx_context::TxContext) {
        // Create and share the registry
        let registry = Registry {
            id: object::new(ctx),
            campaigns: vector::empty<object::ID>(),
            campaigns_by_category: table::new(ctx),
        };
        transfer::share_object(registry);
    }
    
    #[test_only]
    /// Initialize function for testing
    public fun init_for_testing(ctx: &mut tx_context::TxContext) {
        init(ctx)
    }

    // === Public Functions ===
    /// Creates a new crowdfunding campaign
    public entry fun create_campaign(
        name: String,
        description: String,
        image_url: String,
        goal_amount: u64,
        deadline: u64,
        category: String,
        registry: &mut Registry,
        ctx: &mut tx_context::TxContext
    ) {
        // Validate inputs
        assert!(goal_amount > 0, EFundingGoalZero);
        assert!(deadline > tx_context::epoch(ctx), EFundingDeadlineInPast);

        let campaign_uid = object::new(ctx);
        let campaign_id = object::uid_to_inner(&campaign_uid);
        let creator = tx_context::sender(ctx);

        // Create the campaign
        let campaign = Campaign {
            id: campaign_uid,
            name,
            description,
            image_url,
            creator,
            goal_amount,
            deadline,
            category,
            raised: balance::zero(),
            is_active: true,
            backer_count: 0,
        };

        // Create and transfer the owner capability to the creator
        let owner_cap = CampaignOwnerCap {
            id: object::new(ctx),
            campaign_id,
        };
        transfer::transfer(owner_cap, creator);

        // Add campaign to registry
        vector::push_back(&mut registry.campaigns, campaign_id);
        
        // Add to category mapping
        if (!table::contains(&registry.campaigns_by_category, category)) {
            table::add(&mut registry.campaigns_by_category, category, vector::empty<object::ID>());
        };
        let category_campaigns = table::borrow_mut(&mut registry.campaigns_by_category, category);
        vector::push_back(category_campaigns, campaign_id);

        // Emit event
        event::emit(CampaignCreated {
            campaign_id,
            creator,
            name,
            goal_amount,
            deadline,
        });

        // Share the campaign object so anyone can donate
        transfer::share_object(campaign);
    }

    /// Donate to a campaign
    public entry fun donate(
        campaign: &mut Campaign,
        donation: coin::Coin<SUI>,
        is_anonymous: bool,
        ctx: &mut tx_context::TxContext
    ) {
        // Check if campaign is still active
        assert!(campaign.is_active, EFundingEnded);
        assert!(tx_context::epoch(ctx) <= campaign.deadline, EFundingEnded);

        let donor = tx_context::sender(ctx);
        let amount = coin::value(&donation);
        let donation_balance = coin::into_balance(donation);

        // Add donation to campaign
        balance::join(&mut campaign.raised, donation_balance);

        // Increment backer count
        campaign.backer_count = campaign.backer_count + 1;

        // Create receipt for donor
        let receipt = DonationReceipt {
            id: object::new(ctx),
            campaign_id: object::id(campaign),
            donor,
            amount,
            timestamp: tx_context::epoch(ctx),
            is_anonymous,
        };
        transfer::transfer(receipt, donor);

        // Emit event
        event::emit(DonationReceived {
            campaign_id: object::id(campaign),
            donor,
            amount,
            is_anonymous,
        });
    }

    /// Withdraw funds from a successful campaign
    public entry fun withdraw_funds(
        campaign: &mut Campaign,
        cap: &CampaignOwnerCap,
        ctx: &mut tx_context::TxContext
    ) {
        // Verify owner capability
        assert!(cap.campaign_id == object::id(campaign), ENotFundOwner);

        // Check if campaign has ended
        assert!(tx_context::epoch(ctx) > campaign.deadline, EFundingNotEnded);

        // Check if goal was reached
        let raised_amount = balance::value(&campaign.raised);
        assert!(raised_amount >= campaign.goal_amount, EFundingGoalNotReached);

        // Mark campaign as inactive
        campaign.is_active = false;

        // Take all funds from the campaign
        let funds = balance::split(&mut campaign.raised, raised_amount);
        let coin = coin::from_balance(funds, ctx);

        // Emit event
        event::emit(FundsWithdrawn {
            campaign_id: object::id(campaign),
            amount: raised_amount,
            recipient: tx_context::sender(ctx),
        });

        // Transfer funds to campaign creator
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    // === View Functions ===
    /// Get campaign details
    public fun get_campaign_details(campaign: &Campaign): (
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
            balance::value(&campaign.raised),
            campaign.is_active,
            campaign.backer_count
        )
    }

    /// Check if campaign goal has been reached
    public fun is_goal_reached(campaign: &Campaign): bool {
        balance::value(&campaign.raised) >= campaign.goal_amount
    }

    /// Check if campaign has ended
    public fun is_campaign_ended(campaign: &Campaign, ctx: &tx_context::TxContext): bool {
        tx_context::epoch(ctx) > campaign.deadline
    }
    
    /// Get all campaigns from registry
    public fun get_all_campaigns(registry: &Registry): vector<object::ID> {
        registry.campaigns
    }
    
    /// Get campaigns by category
    public fun get_campaigns_by_category(registry: &Registry, category: String): vector<object::ID> {
        if (table::contains(&registry.campaigns_by_category, category)) {
            *table::borrow(&registry.campaigns_by_category, category)
        } else {
            vector::empty<object::ID>()
        }
    }
    
    /// Get donation receipt details
    public fun get_donation_receipt_details(receipt: &DonationReceipt): (object::ID, address, u64, u64, bool) {
        (
            receipt.campaign_id,
            receipt.donor,
            receipt.amount,
            receipt.timestamp,
            receipt.is_anonymous
        )
    }
}
