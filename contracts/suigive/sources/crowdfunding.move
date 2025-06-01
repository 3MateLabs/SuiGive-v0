// SuiGive Crowdfunding Smart Contract
// A decentralized crowdfunding platform built on Sui blockchain
module suigive::crowdfunding {
    // Import required modules
    use sui::object;
    use sui::coin;
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context;
    use sui::event;
    use sui::table::{Self as table};
    use std::vector;
    use std::string::{Self, String};
    // Use the new donation receipt module instead of donation_token
    use suigive::donation_receipt;
    use suigive::sg_sui_token::{Self, SgSuiTreasury, SgSuiMinterCap};
    // Import sgUSD token
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
        raised: Balance<SUI>,
        // Track sgUSD donations separately
        raised_sgusd: Balance<SG_USD>,
        is_active: bool,
        backer_count: u64,
        // Track distributed funds for closed-loop tokens
        distributed_amount: u64,
        // Track total amount of funds withdrawn
        withdrawn_amount: u64,
        // Track total sgUSD withdrawn
        withdrawn_sgusd: u64,
    }

    /// Capability given to the campaign creator to withdraw funds
    public struct CampaignOwnerCap has key, store {
        id: object::UID,
        campaign_id: object::ID,
    }

    // Removed the DonationReceipt struct as we now use the one from donation_receipt module

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
        token_type: String,
        is_anonymous: bool,
    }

    /// Emitted when funds are withdrawn by the campaign creator
    public struct FundsWithdrawn has copy, drop {
        campaign_id: object::ID,
        amount: u64,
        recipient: address,
    }
    
    /// Emitted when funds are distributed using sgSUI tokens
    public struct FundsDistributed has copy, drop {
        campaign_id: object::ID,
        amount: u64,
        recipient: address,
    }
    
    /// Emitted when the registry is created
    public struct RegistryCreated has copy, drop {
        registry_id: object::ID,
    }

    // === Module Initialization ===
    fun init(ctx: &mut tx_context::TxContext) {
        // Create and share the registry
        let registry = Registry {
            id: object::new(ctx),
            campaigns: vector::empty<object::ID>(),
            campaigns_by_category: table::new(ctx),
        };
        
        // Emit an event with the registry ID to make it easier to find
        event::emit(RegistryCreated {
            registry_id: object::id(&registry)
        });
        
        transfer::share_object(registry);
    }
    
    #[test_only]
    /// Initialize function for testing
    public fun init_for_testing(ctx: &mut tx_context::TxContext) {
        init(ctx)
    }

    /// Public entry function to initialize the registry after publishing
    public entry fun initialize_registry(ctx: &mut tx_context::TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            campaigns: vector::empty<object::ID>(),
            campaigns_by_category: table::new(ctx),
        };
        event::emit(RegistryCreated {
            registry_id: object::id(&registry)
        });
        transfer::share_object(registry);
    }

    // === Public Functions ===
    /// Create a new campaign
    public entry fun create_campaign(
        registry: &mut Registry,
        name: String,
        description: String,
        image_url: String,
        goal_amount: u64,
        deadline: u64,
        category: String,
        ctx: &mut tx_context::TxContext
    ) {
        // Validate inputs
        assert!(deadline > tx_context::epoch(ctx), EFundingDeadlineInPast);
        assert!(goal_amount > 0, EFundingGoalZero);
        
        // Create campaign
        let campaign = Campaign {
            id: object::new(ctx),
            name,
            description,
            image_url,
            creator: tx_context::sender(ctx),
            goal_amount,
            deadline,
            category,
            raised: balance::zero<SUI>(),
            raised_sgusd: balance::zero<SG_USD>(),
            is_active: true,
            backer_count: 0,
            distributed_amount: 0,
            withdrawn_amount: 0,
            withdrawn_sgusd: 0,
        };

        // Create and transfer the owner capability to the creator
        let owner_cap = CampaignOwnerCap {
            id: object::new(ctx),
            campaign_id: object::id(&campaign),
        };
        transfer::transfer(owner_cap, tx_context::sender(ctx));

        // Add campaign to registry
        vector::push_back(&mut registry.campaigns, object::id(&campaign));
        
        // Add to category mapping
        if (!table::contains(&registry.campaigns_by_category, category)) {
            table::add(&mut registry.campaigns_by_category, category, vector::empty<object::ID>());
        };
        let category_campaigns = table::borrow_mut(&mut registry.campaigns_by_category, category);
        vector::push_back(category_campaigns, object::id(&campaign));

        // Emit event
        event::emit(CampaignCreated {
            campaign_id: object::id(&campaign),
            creator: tx_context::sender(ctx),
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
        message: vector<u8>,
        is_anonymous: bool,
        ctx: &mut tx_context::TxContext
    ) {
        // Check if campaign is still active
        assert!(campaign.is_active, EFundingEnded);
        assert!(tx_context::epoch(ctx) <= campaign.deadline, EFundingEnded);
        
        // Get donation amount
        let amount = coin::value(&donation);
        
        // Add donation to campaign funds
        let donation_balance = coin::into_balance(donation);
        balance::join(&mut campaign.raised, donation_balance);
        
        // Update backer count
        campaign.backer_count = campaign.backer_count + 1;
        
        // Create default metadata for the NFT receipt
        let name = b"SuiGive Donation Receipt";
        let description = b"Proof of donation to a SuiGive campaign";
        let url = b"https://ipfs.io/ipfs/bafkreiap7rugqtnfnw5nlui4aavtrj6zrqbxzzanq44sxnztktm3kzdufi";
        
        // Mint soulbound NFT receipt
        let receipt = donation_receipt::mint(
            object::id_address(campaign),
            tx_context::sender(ctx),
            amount,
            message,
            is_anonymous,
            name,
            description,
            url,
            ctx
        );
        
        // Transfer soulbound NFT receipt to donor using the donation_receipt module
        donation_receipt::transfer_receipt(receipt, tx_context::sender(ctx));
        
        // Emit event
        event::emit(DonationReceived {
            campaign_id: object::id(campaign),
            donor: tx_context::sender(ctx),
            amount,
            token_type: std::string::utf8(b"SUI"),
            is_anonymous,
        });
    }
    
    /// Donate to a campaign using sgUSD tokens
    public entry fun donate_sgusd(
        campaign: &mut Campaign,
        donation: coin::Coin<SG_USD>,
        message: vector<u8>,
        is_anonymous: bool,
        ctx: &mut tx_context::TxContext
    ) {
        // Check if campaign is still active
        assert!(campaign.is_active, EFundingEnded);
        assert!(tx_context::epoch(ctx) <= campaign.deadline, EFundingEnded);
        
        // Get donation amount
        let amount = coin::value(&donation);
        
        // Add donation to campaign sgUSD funds
        let donation_balance = coin::into_balance(donation);
        balance::join(&mut campaign.raised_sgusd, donation_balance);
        
        // Update backer count
        campaign.backer_count = campaign.backer_count + 1;
        
        // Create default metadata for the NFT receipt
        let name = b"SuiGive sgUSD Donation Receipt";
        let description = b"Proof of sgUSD donation to a SuiGive campaign";
        let url = b"https://ipfs.io/ipfs/bafkreiap7rugqtnfnw5nlui4aavtrj6zrqbxzzanq44sxnztktm3kzdufi";
        
        // Mint soulbound NFT receipt
        let receipt = donation_receipt::mint(
            object::id_address(campaign),
            tx_context::sender(ctx),
            amount,
            message,
            is_anonymous,
            name,
            description,
            url,
            ctx
        );
        
        // Transfer soulbound NFT receipt to donor using the donation_receipt module
        donation_receipt::transfer_receipt(receipt, tx_context::sender(ctx));
        
        // Emit event
        event::emit(DonationReceived {
            campaign_id: object::id(campaign),
            donor: tx_context::sender(ctx),
            amount,
            token_type: std::string::utf8(b"sgUSD"),
            is_anonymous,
        });
    }

    /// Withdraw funds from a successful campaign
    public entry fun withdraw_funds(
        campaign: &mut Campaign, 
        cap: &CampaignOwnerCap,
        ctx: &mut tx_context::TxContext
    ) {
        // Verify campaign owner
        assert!(object::id(campaign) == cap.campaign_id, ENotFundOwner);
        
        // Get available balance
        let available = balance::value(&campaign.raised) - campaign.withdrawn_amount;
        assert!(available > 0, EInsufficientFunds);
        
        // Update withdrawn amount
        campaign.withdrawn_amount = campaign.withdrawn_amount + available;
        
        // Transfer funds to campaign owner
        let funds = coin::from_balance(balance::split(&mut campaign.raised, available), ctx);
        transfer::public_transfer(funds, tx_context::sender(ctx));
        
        // Emit event
        event::emit(FundsWithdrawn {
            campaign_id: object::id(campaign),
            recipient: tx_context::sender(ctx),
            amount: available
        });
    }
    
    /// Withdraw sgUSD funds from a campaign
    public entry fun withdraw_sgusd_funds(
        campaign: &mut Campaign, 
        cap: &CampaignOwnerCap,
        ctx: &mut tx_context::TxContext
    ) {
        // Verify campaign owner
        assert!(object::id(campaign) == cap.campaign_id, ENotFundOwner);
        
        // Get available balance
        let available = balance::value(&campaign.raised_sgusd) - campaign.withdrawn_sgusd;
        assert!(available > 0, EInsufficientFunds);
        
        // Update withdrawn amount
        campaign.withdrawn_sgusd = campaign.withdrawn_sgusd + available;
        
        // Transfer funds to campaign owner
        let funds = coin::from_balance(balance::split(&mut campaign.raised_sgusd, available), ctx);
        transfer::public_transfer(funds, tx_context::sender(ctx));
        
        // Emit event
        event::emit(FundsWithdrawn {
            campaign_id: object::id(campaign),
            recipient: tx_context::sender(ctx),
            amount: available
        });

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
    
    /// Create admin capability for burning donation receipts
    public fun create_receipt_admin_cap(
        campaign: &Campaign,
        cap: &CampaignOwnerCap,
        ctx: &mut tx_context::TxContext
    ): donation_receipt::AdminCap {
        // Verify owner capability
        assert!(cap.campaign_id == object::id(campaign), ENotFundOwner);
        
        // Create admin capability for the campaign
        donation_receipt::create_admin_cap(object::id_address(campaign), ctx)
    }
    
    /// Process refund by burning receipt and returning funds
    public entry fun process_refund(
        campaign: &mut Campaign,
        receipt: donation_receipt::DonationReceipt,
        admin_cap: &donation_receipt::AdminCap,
        reason: vector<u8>,
        ctx: &mut tx_context::TxContext
    ) {
        // Get receipt details
        let (campaign_id, donor, amount, _, _, _) = donation_receipt::get_details(&receipt);
        
        // Verify campaign ID
        assert!(campaign_id == object::id_address(campaign), ENotFundOwner);
        
        // Check if campaign has sufficient funds
        let available_amount = balance::value(&campaign.raised);
        assert!(available_amount >= amount, EInsufficientFunds);
        
        // Extract funds for refund
        let refund_balance = balance::split(&mut campaign.raised, amount);
        let refund_coin = coin::from_balance(refund_balance, ctx);
        
        // Burn the receipt
        donation_receipt::burn(receipt, reason, admin_cap, ctx);
        
        // Update backer count
        if (campaign.backer_count > 0) {
            campaign.backer_count = campaign.backer_count - 1;
        };
        
        // Transfer refund to donor
        transfer::public_transfer(refund_coin, donor);
    }
    
    /// Check if a capability belongs to a campaign
    public fun is_campaign_owner(campaign: &Campaign, cap: &CampaignOwnerCap): bool {
        object::id(campaign) == cap.campaign_id
    }
    
    /// Get the current balance of a campaign
    public fun get_campaign_balance(campaign: &Campaign): u64 {
        balance::value(&campaign.raised)
    }
    
    /// Extract funds from a campaign for closed-loop token distribution
    /// Only callable by modules that integrate with this one
    public fun extract_funds(
        campaign: &mut Campaign,
        cap: &CampaignOwnerCap,
        amount: u64,
        ctx: &mut tx_context::TxContext
    ): coin::Coin<SUI> {
        // Verify owner capability
        assert!(cap.campaign_id == object::id(campaign), ENotFundOwner);
        
        // Check if campaign has sufficient funds
        let available_amount = balance::value(&campaign.raised);
        assert!(available_amount >= amount, EInsufficientFunds);
        
        // Take funds from the campaign
        let funds = balance::split(&mut campaign.raised, amount);
        
        // Update distributed amount
        campaign.distributed_amount = campaign.distributed_amount + amount;
        
        // Convert to coin and return
        coin::from_balance(funds, ctx)
    }
    
    /// Get distributed amount from a campaign
    public fun get_distributed_amount(campaign: &Campaign): u64 {
        campaign.distributed_amount
    }
    
    /// Get withdrawn amount from a campaign
    public fun get_withdrawn_amount(campaign: &Campaign): u64 {
        campaign.withdrawn_amount
    }
    
    /// Get available amount that can be distributed or withdrawn
    public fun get_available_amount(campaign: &Campaign): u64 {
        let total = balance::value(&campaign.raised);
        total
    }
    
    /// Distribute funds from campaign to service providers using sgSUI tokens
    public entry fun distribute_funds(
        campaign: &mut Campaign,
        cap: &CampaignOwnerCap,
        treasury: &mut SgSuiTreasury,
        minter_cap: &mut SgSuiMinterCap,
        amount: u64,
        recipient: address,
        ctx: &mut tx_context::TxContext
    ) {
        // Verify owner capability
        assert!(cap.campaign_id == object::id(campaign), ENotFundOwner);
        
        // Check if campaign has sufficient funds
        let available_amount = balance::value(&campaign.raised);
        assert!(available_amount >= amount, EInsufficientFunds);
        
        // Extract funds from the campaign
        let extracted_funds = extract_funds(campaign, cap, amount, ctx);
        
        // Add funds to treasury and mint sgSUI tokens
        sg_sui_token::add_funds_and_mint(
            treasury,
            minter_cap,
            extracted_funds,
            recipient,
            object::id_address(campaign),
            ctx
        );
        
        // Emit event for fund distribution
        event::emit(FundsDistributed {
            campaign_id: object::id(campaign),
            amount,
            recipient,
        });
    }
    
    /// Allow campaign creator to check if a campaign has ended and can be withdrawn
    public fun can_withdraw(campaign: &Campaign, ctx: &tx_context::TxContext): bool {
        tx_context::epoch(ctx) > campaign.deadline
    }
    
    /// Get the ID of a registry object - useful for finding the registry
    public fun get_registry_id(registry: &Registry): object::ID {
        object::id(registry)
    }
}
