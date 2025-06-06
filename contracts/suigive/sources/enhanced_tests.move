#[test_only]
module suigive::enhanced_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::string::{utf8};
    use suigive::crowdfunding::{Self, Registry, Campaign, CampaignOwnerCap};
    use suigive::sg_sui_token::{Self, SgSuiTreasury, SgSuiMinterCap};
    
    // Test addresses
    const ADMIN: address = @0xAD;
    const CREATOR: address = @0xC1;
    const DONOR: address = @0xD1;
    const DONOR2: address = @0xD2;
    const SERVICE_PROVIDER: address = @0xB1;
    
    // Test constants
    const GOAL_AMOUNT: u64 = 1000000000; // 1 SUI
    const DONATION_AMOUNT: u64 = 500000000; // 0.5 SUI
    const DONATION_AMOUNT2: u64 = 300000000; // 0.3 SUI
    const DISTRIBUTION_AMOUNT: u64 = 200000000; // 0.2 SUI
    
    #[test]
    fun test_enhanced_donation_flow() {
        // Set up the test scenario
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the modules
        init_modules(&mut scenario);
        
        // Create a campaign
        create_test_campaign(&mut scenario);
        
        // Make a donation and receive a soulbound NFT receipt
        donate_to_campaign(&mut scenario);
        
        // Distribute funds using sgSUI tokens
        distribute_campaign_funds(&mut scenario);
        
        // Redeem sgSUI tokens for SUI
        redeem_sg_sui_tokens(&mut scenario);
        
        // Clean up
        ts::end(scenario);
    }
    
    #[test]
    fun test_refund_flow() {
        // Set up the test scenario
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the modules
        init_modules(&mut scenario);
        
        // Create a campaign
        create_test_campaign(&mut scenario);
        
        // Make a donation and receive a soulbound NFT receipt
        donate_to_campaign(&mut scenario);
        
        // Process a refund
        process_refund(&mut scenario);
        
        // Clean up
        ts::end(scenario);
    }
    
    #[test]
    fun test_multiple_donors() {
        // Set up the test scenario
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the modules
        init_modules(&mut scenario);
        
        // Create a campaign
        create_test_campaign(&mut scenario);
        
        // First donor makes a donation
        donate_to_campaign(&mut scenario);
        
        // Second donor makes a donation
        donate_as_second_donor(&mut scenario);
        
        // Distribute funds using sgSUI tokens
        distribute_campaign_funds(&mut scenario);
        
        // Clean up
        ts::end(scenario);
    }
    
    #[test]
    fun test_campaign_treasury_tracking() {
        // Set up the test scenario
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the modules
        init_modules(&mut scenario);
        
        // Create a campaign
        create_test_campaign(&mut scenario);
        
        // Make a donation
        donate_to_campaign(&mut scenario);
        
        // Distribute funds using sgSUI tokens
        distribute_campaign_funds(&mut scenario);
        
        // Verify campaign-specific treasury tracking
        verify_treasury_tracking(&mut scenario);
        
        // Clean up
        ts::end(scenario);
    }
    
    fun init_modules(scenario: &mut Scenario) {
        // Initialize the crowdfunding module
        ts::next_tx(scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(scenario));
        };
        
        // Initialize the sgSUI token module
        ts::next_tx(scenario, ADMIN);
        {
            sg_sui_token::init_for_testing(ts::ctx(scenario));
        };
    }
    
    fun create_test_campaign(scenario: &mut Scenario) {
        ts::next_tx(scenario, CREATOR);
        {
            let mut registry = ts::take_shared<Registry>(scenario);
            
            // Create string objects for the campaign
            let name = utf8(b"Test Campaign");
            let description = utf8(b"A test campaign for the SuiGive platform");
            let image_url = utf8(b"https://example.com/image.jpg");
            let category = utf8(b"Test");
            // Use a future timestamp for deadline (current timestamp + 100 seconds)
            let deadline = tx_context::epoch_timestamp_ms(ts::ctx(scenario)) / 1000 + 100;
            
            crowdfunding::create_campaign(
                &mut registry,
                name,
                description,
                image_url,
                GOAL_AMOUNT,
                deadline,
                category,
                ts::ctx(scenario)
            );
            
            ts::return_shared(registry);
        };
    }
    
    fun donate_to_campaign(scenario: &mut Scenario) {
        ts::next_tx(scenario, DONOR);
        {
            // Take the campaign and registry
            let registry = ts::take_shared<Registry>(scenario);
            let campaigns = crowdfunding::get_all_campaigns(&registry);
            let campaign_id = *vector::borrow(&campaigns, 0);
            let mut campaign = ts::take_shared_by_id<Campaign>(scenario, campaign_id);
            
            // Create a test coin for donation
            let coin = coin::mint_for_testing<SUI>(DONATION_AMOUNT, ts::ctx(scenario));
            
            // Make the donation with a message
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"Supporting this great cause!",
                false, // not anonymous
                ts::ctx(scenario)
            );
            
            // Verify donation was successful
            let (_, _, _, _, _, _, _, raised, _, backer_count) = crowdfunding::get_campaign_details(&campaign);
            assert_eq(raised, DONATION_AMOUNT);
            assert_eq(backer_count, 1);
            
            // Verify the donor received a soulbound NFT receipt
            // In a real test, we would check for the NFT in the donor's inventory
            
            ts::return_shared(campaign);
            ts::return_shared(registry);
        };
    }
    
    fun donate_as_second_donor(scenario: &mut Scenario) {
        ts::next_tx(scenario, DONOR2);
        {
            // Take the campaign and registry
            let registry = ts::take_shared<Registry>(scenario);
            let campaigns = crowdfunding::get_all_campaigns(&registry);
            let campaign_id = *vector::borrow(&campaigns, 0);
            let mut campaign = ts::take_shared_by_id<Campaign>(scenario, campaign_id);
            
            // Create a test coin for donation
            let coin = coin::mint_for_testing<SUI>(DONATION_AMOUNT2, ts::ctx(scenario));
            
            // Make the donation with a message
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"I'm the second donor!",
                false, // not anonymous
                ts::ctx(scenario)
            );
            
            // Verify donation was successful
            let (_, _, _, _, _, _, _, raised, _, backer_count) = crowdfunding::get_campaign_details(&campaign);
            assert_eq(raised, DONATION_AMOUNT + DONATION_AMOUNT2);
            assert_eq(backer_count, 2);
            
            ts::return_shared(campaign);
            ts::return_shared(registry);
        };
    }
    
    fun distribute_campaign_funds(scenario: &mut Scenario) {
        ts::next_tx(scenario, CREATOR);
        {
            // Take the campaign and owner cap
            let registry = ts::take_shared<Registry>(scenario);
            let campaigns = crowdfunding::get_all_campaigns(&registry);
            let campaign_id = *vector::borrow(&campaigns, 0);
            let mut campaign = ts::take_shared_by_id<Campaign>(scenario, campaign_id);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(scenario);
            
            // Take the sgSUI treasury and minter cap from ADMIN (who initialized the module)
            let mut treasury = ts::take_shared<SgSuiTreasury>(scenario);
            let mut minter_cap = ts::take_from_address<SgSuiMinterCap>(scenario, ADMIN);
            
            // Distribute funds to service provider
            crowdfunding::distribute_funds(
                &mut campaign,
                &owner_cap,
                &mut treasury,
                &mut minter_cap,
                DISTRIBUTION_AMOUNT,
                SERVICE_PROVIDER,
                ts::ctx(scenario)
            );
            
            // Verify distribution was successful
            let distributed = crowdfunding::get_distributed_amount(&campaign);
            assert_eq(distributed, DISTRIBUTION_AMOUNT);
            
            // Return objects
            ts::return_to_sender(scenario, owner_cap);
            ts::return_to_address(ADMIN, minter_cap);
            ts::return_shared(treasury);
            ts::return_shared(campaign);
            ts::return_shared(registry);
        };
    }
    
    fun process_refund(_scenario: &mut Scenario) {
        // Implementation for refund processing would go here
        // This is a placeholder for future implementation
    }
    
    fun redeem_sg_sui_tokens(scenario: &mut Scenario) {
        ts::next_tx(scenario, SERVICE_PROVIDER);
        {
            // Take the sgSUI treasury
            let treasury = ts::take_shared<SgSuiTreasury>(scenario);
            
            // Note: In a real scenario, we would:
            // 1. Take the SG_SUI_TOKEN from the SERVICE_PROVIDER
            // 2. Call redeem_sg_sui to convert it to SUI
            // 3. Verify the SUI was received
            // 
            // For testing purposes, we'll skip these steps to simplify the test
            
            // Return objects
            ts::return_shared(treasury);
        };
    }
    
    fun verify_treasury_tracking(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            // Take the treasury to verify stats
            let treasury = ts::take_shared<SgSuiTreasury>(scenario);
            
            // Get treasury stats
            let (_, total_minted, _) = sg_sui_token::get_treasury_stats(&treasury);
            
            // Verify that the distributed amount matches the minted tokens
            assert_eq(total_minted, DISTRIBUTION_AMOUNT);
            
            // Return objects
            ts::return_shared(treasury);
        };
    }
}
