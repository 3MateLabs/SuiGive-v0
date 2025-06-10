// SuiGive Closed-Loop Token (sgSUI) Module
// Implements a closed-loop token system for campaign fund distribution
module suigive::sg_sui_token {
    // These modules are already provided by default
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::option;
    use sui::table::{Self, Table};
    
    /// The sgSUI token type - represents a closed-loop token for campaign fund distribution
    public struct SG_SUI_TOKEN has drop {}
    
    /// A capability that allows the holder to mint sgSUI tokens
    public struct SgSuiMinterCap has key {
        id: UID,
        treasury_cap: TreasuryCap<SG_SUI_TOKEN>,
    }
    
    /// Stores the backing SUI for sgSUI tokens
    public struct SgSuiTreasury has key {
        id: UID,
        balance: Balance<SUI>,
        // Track funds by campaign
        campaign_balances: Table<address, u64>,
        // Track total minted and redeemed amounts
        total_minted: u64,
        total_redeemed: u64,
    }
    
    /// Event emitted when sgSUI tokens are minted
    public struct SgSuiMinted has copy, drop {
        campaign_id: address,
        amount: u64,
        recipient: address,
    }
    
    /// Event emitted when sgSUI tokens are redeemed for SUI
    public struct SgSuiRedeemed has copy, drop {
        amount: u64,
        redeemer: address,
    }
    
    /// Event emitted when the treasury is created
    public struct TreasuryCreated has copy, drop {
        treasury_id: address,
    }
    
    /// Initialize the module
    fun init(otw: SG_SUI_TOKEN, ctx: &mut TxContext) {
        // Create the sgSUI token type
        let (treasury_cap, metadata) = coin::create_currency(
            otw,
            9, // 9 decimals like SUI
            b"sgSUI", // Symbol
            b"SuiGive SUI", // Name
            b"Closed-loop token for SuiGive campaign fund distribution", // Description
            option::none(), // Icon URL
            ctx
        );
        
        // Create the minter capability
        let minter_cap = SgSuiMinterCap {
            id: object::new(ctx),
            treasury_cap,
        };
        
        // Create the treasury
        let treasury = SgSuiTreasury {
            id: object::new(ctx),
            balance: balance::zero(),
            campaign_balances: table::new(ctx),
            total_minted: 0,
            total_redeemed: 0,
        };
        
        // Emit an event with the treasury ID to make it easier to find
        event::emit(TreasuryCreated {
            treasury_id: object::id_address(&treasury),
        });
        
        // Transfer the minter capability to the module deployer
        transfer::transfer(minter_cap, tx_context::sender(ctx));
        
        // Share the treasury as a shared object
        transfer::share_object(treasury);
        
        // Transfer the metadata to the module deployer
        transfer::public_transfer(metadata, tx_context::sender(ctx));
    }
    
    /// Add funds to the treasury and mint sgSUI tokens
    public entry fun add_funds_and_mint(
        treasury: &mut SgSuiTreasury,
        minter_cap: &mut SgSuiMinterCap,
        funds: Coin<SUI>,
        recipient: address,
        campaign_id: address,
        ctx: &mut TxContext
    ) {
        // Get the amount of funds
        let amount = coin::value(&funds);
        
        // Add funds to treasury
        let sui_balance = coin::into_balance(funds);
        balance::join(&mut treasury.balance, sui_balance);
        
        // Update campaign balance tracking
        if (table::contains(&treasury.campaign_balances, campaign_id)) {
            let campaign_balance = table::borrow_mut(&mut treasury.campaign_balances, campaign_id);
            *campaign_balance = *campaign_balance + amount;
        } else {
            table::add(&mut treasury.campaign_balances, campaign_id, amount);
        };
        
        // Update total minted
        treasury.total_minted = treasury.total_minted + amount;
        
        // Mint equivalent sgSUI tokens
        let sg_sui = coin::mint(&mut minter_cap.treasury_cap, amount, ctx);
        
        // Emit event
        event::emit(SgSuiMinted {
            campaign_id,
            amount,
            recipient,
        });
        
        // Transfer sgSUI tokens to recipient
        transfer::public_transfer(sg_sui, recipient);
    }
    
    // === Errors ===
    const EInsufficientFunds: u64 = 1;
    const EInvalidCampaignId: u64 = 2;
    const EInsufficientCampaignFunds: u64 = 3;
    
    /// Redeem sgSUI tokens for SUI (original function for backward compatibility)
    public entry fun redeem_sg_sui(
        treasury: &mut SgSuiTreasury,
        sg_sui: Coin<SG_SUI_TOKEN>,
        ctx: &mut TxContext
    ) {
        // For backward compatibility, we'll use a default campaign ID
        // In a real implementation, you might want to track this differently
        let default_campaign_id = @0x0; // Use a special address to track "unattributed" redemptions
        let sui_coin = redeem_sg_sui_internal(treasury, sg_sui, default_campaign_id, ctx);
        // Transfer SUI to redeemer
        transfer::public_transfer(sui_coin, tx_context::sender(ctx));
    }
    
    /// Redeem sgSUI tokens for SUI with campaign tracking
    public entry fun redeem_sg_sui_with_campaign(
        treasury: &mut SgSuiTreasury,
        sg_sui: Coin<SG_SUI_TOKEN>,
        campaign_id: address,
        ctx: &mut TxContext
    ) {
        let sui_coin = redeem_sg_sui_internal(treasury, sg_sui, campaign_id, ctx);
        // Transfer SUI to redeemer
        transfer::public_transfer(sui_coin, tx_context::sender(ctx));
    }
    
    /// Internal function to handle redemption logic
    fun redeem_sg_sui_internal(
        treasury: &mut SgSuiTreasury,
        sg_sui: Coin<SG_SUI_TOKEN>,
        campaign_id: address,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let amount = coin::value(&sg_sui);
        
        // Ensure treasury has enough funds
        assert!(balance::value(&treasury.balance) >= amount, EInsufficientFunds);
        
        // Update campaign balance tracking
        if (table::contains(&treasury.campaign_balances, campaign_id)) {
            let campaign_balance = table::borrow_mut(&mut treasury.campaign_balances, campaign_id);
            assert!(*campaign_balance >= amount, EInsufficientCampaignFunds);
            *campaign_balance = *campaign_balance - amount;
        } else {
            // If campaign doesn't exist in our tracking, it's an error
            // unless it's the default campaign ID for backward compatibility
            assert!(campaign_id == @0x0, EInvalidCampaignId);
        };
        
        // Update total redeemed
        treasury.total_redeemed = treasury.total_redeemed + amount;
        
        // Destroy the sgSUI tokens
        coin::destroy_zero(sg_sui);
        
        // Extract SUI from treasury
        let sui_funds = balance::split(&mut treasury.balance, amount);
        let sui_coin = coin::from_balance(sui_funds, ctx);
        
        // Emit event
        event::emit(SgSuiRedeemed {
            amount,
            redeemer: tx_context::sender(ctx),
        });
        
        // Return SUI coin to caller for better composability
        sui_coin
    }
    
    /// Check the balance of the treasury
    public fun treasury_balance(treasury: &SgSuiTreasury): u64 {
        balance::value(&treasury.balance)
    }
    
    /// Get campaign balance from the treasury
    public fun get_campaign_balance(treasury: &SgSuiTreasury, campaign_id: address): u64 {
        if (table::contains(&treasury.campaign_balances, campaign_id)) {
            *table::borrow(&treasury.campaign_balances, campaign_id)
        } else {
            0
        }
    }
    
    /// Get treasury statistics
    public fun get_treasury_stats(treasury: &SgSuiTreasury): (u64, u64, u64) {
        (
            balance::value(&treasury.balance),
            treasury.total_minted,
            treasury.total_redeemed
        )
    }
    
    /// Transfer sgSUI tokens
    public entry fun transfer_sg_sui(
        sg_sui: Coin<SG_SUI_TOKEN>,
        recipient: address,
        _ctx: &mut TxContext
    ) {
        transfer::public_transfer(sg_sui, recipient);
    }
    
    #[test_only]
    /// Initialize function for testing
    public fun init_for_testing(ctx: &mut TxContext) {
        init(SG_SUI_TOKEN {}, ctx)
    }
}
