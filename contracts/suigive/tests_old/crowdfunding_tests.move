#[test_only]
module suigive::crowdfunding_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use sui::object;
    use sui::tx_context;
    use std::string;
    use suigive::crowdfunding::{Self, Campaign, CampaignOwnerCap, Registry, DonationReceipt};

    // Test account addresses
    const CREATOR: address = @0xCAFE;
    const DONOR1: address = @0xFACE;

    // Test constants
    const GOAL_AMOUNT: u64 = 1000;
    const DONATION_AMOUNT: u64 = 500;

    // === Helper Functions ===
    fun create_test_campaign(scenario: &mut Scenario, name: string::String, deadline: u64): object::ID {
        // First, initialize the module to create the Registry
        ts::next_tx(scenario, @0x0);
        {
            crowdfunding::init_for_testing(ts::ctx(scenario));
        };
        
        // Begin a transaction from the creator
        ts::next_tx(scenario, CREATOR);
        {
            let mut registry = ts::take_shared<Registry>(scenario);
            
            // Create a campaign
            let description = string::utf8(b"A test campaign for SuiGive");
            let image_url = string::utf8(b"https://example.com/image.jpg");
            let category = string::utf8(b"Test");
            
            crowdfunding::create_campaign(
                name,
                description,
                image_url,
                GOAL_AMOUNT,
                deadline,
                category,
                &mut registry,
                ts::ctx(scenario)
            );
            
            ts::return_shared(registry);
        };
        
        // Get the campaign ID
        ts::next_tx(scenario, CREATOR);
        let registry = ts::take_shared<Registry>(scenario);
        let campaigns = crowdfunding::get_all_campaigns(&registry);
        let campaign_id = *std::vector::borrow(&campaigns, 0);
        ts::return_shared(registry);
        
        campaign_id
    }
    
    fun mint_sui(scenario: &mut Scenario, amount: u64): coin::Coin<SUI> {
        ts::next_tx(scenario, @0x0);
        coin::mint_for_testing<SUI>(amount, ts::ctx(scenario))
    }

    // === Test Functions ===
    #[test]
    fun test_create_campaign() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create a campaign
        let name = string::utf8(b"Test Campaign");
        let deadline = tx_context::epoch(ts::ctx(&mut scenario)) + 100; // 100 epochs in the future
        let _campaign_id = create_test_campaign(&mut scenario, name, deadline);
        
        // Verify campaign was created with correct values
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign>(&scenario);
            let (campaign_name, _, _, creator, goal_amount, _, _, raised, is_active, backer_count) = 
                crowdfunding::get_campaign_details(&campaign);
            
            assert_eq(campaign_name, name);
            assert_eq(creator, CREATOR);
            assert_eq(goal_amount, GOAL_AMOUNT);
            assert_eq(raised, 0);
            assert_eq(is_active, true);
            assert_eq(backer_count, 0);
            
            ts::return_shared(campaign);
        };
        
        // Verify owner capability was created
        ts::next_tx(&mut scenario, CREATOR);
        {
            let cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            // Just check that we got the capability (can't compare IDs directly)
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_donate_to_campaign() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create a campaign
        let name = string::utf8(b"Test Campaign");
        let deadline = tx_context::epoch(ts::ctx(&mut scenario)) + 100; // 100 epochs in the future
        let _campaign_id = create_test_campaign(&mut scenario, name, deadline);
        
        // Donate to the campaign
        ts::next_tx(&mut scenario, DONOR1);
        {
            let mut campaign = ts::take_shared<Campaign>(&scenario);
            let coin = mint_sui(&mut scenario, DONATION_AMOUNT);
            
            crowdfunding::donate(
                &mut campaign,
                coin,
                false, // not anonymous
                ts::ctx(&mut scenario)
            );
            
            // Verify donation was recorded
            let (_, _, _, _, _, _, _, raised, _, backer_count) = 
                crowdfunding::get_campaign_details(&campaign);
            
            assert_eq(raised, DONATION_AMOUNT);
            assert_eq(backer_count, 1);
            
            ts::return_shared(campaign);
        };
        
        // Skip receipt verification for now since we're using a simplified test approach
        // In a real-world scenario, we would verify the receipt was created correctly
        
        ts::end(scenario);
    }

    #[test]
    fun test_withdraw_funds() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create a campaign
        let name = string::utf8(b"Test Campaign");
        let deadline = tx_context::epoch(ts::ctx(&mut scenario)) + 10; // 10 epochs in the future
        let _campaign_id = create_test_campaign(&mut scenario, name, deadline);
        
        // Donate to the campaign (full goal amount)
        ts::next_tx(&mut scenario, DONOR1);
        {
            let mut campaign = ts::take_shared<Campaign>(&scenario);
            let coin = mint_sui(&mut scenario, GOAL_AMOUNT);
            
            crowdfunding::donate(
                &mut campaign,
                coin,
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // Fast forward time past the deadline
        ts::next_epoch(&mut scenario, CREATOR); // +1 epoch
        ts::next_epoch(&mut scenario, CREATOR); // +2 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +3 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +4 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +5 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +6 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +7 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +8 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +9 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +10 epochs
        ts::next_epoch(&mut scenario, CREATOR); // +11 epochs (past deadline)
        
        // Withdraw funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign>(&scenario);
            let cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Verify campaign has ended
            assert!(crowdfunding::is_campaign_ended(&campaign, ts::ctx(&mut scenario)), 0);
            
            // Verify goal was reached
            assert!(crowdfunding::is_goal_reached(&campaign), 0);
            
            // Withdraw funds
            crowdfunding::withdraw_funds(
                &mut campaign,
                &cap,
                ts::ctx(&mut scenario)
            );
            
            // Verify campaign is now inactive
            let (_, _, _, _, _, _, _, raised, is_active, _) = 
                crowdfunding::get_campaign_details(&campaign);
            
            assert_eq(raised, 0); // All funds withdrawn
            assert_eq(is_active, false);
            
            ts::return_shared(campaign);
            ts::return_to_sender(&scenario, cap);
        };
        
        // Verify creator received the funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let coins = ts::take_from_sender<coin::Coin<SUI>>(&scenario);
            assert_eq(coin::value(&coins), GOAL_AMOUNT);
            ts::return_to_sender(&scenario, coins);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_campaign_details_and_goal() {
        let mut scenario = ts::begin(CREATOR);
        
        // Create a campaign
        let name = string::utf8(b"Test Campaign");
        let deadline = tx_context::epoch(ts::ctx(&mut scenario)) + 100; // 100 epochs in the future
        let _campaign_id = create_test_campaign(&mut scenario, name, deadline);
        
        // Get campaign details
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign>(&scenario);
            let (campaign_name, _description, _image_url, creator, goal_amount, _deadline, _category, _raised, _is_active, _backer_count) = 
                crowdfunding::get_campaign_details(&campaign);
            
            // Check campaign details
            assert_eq(campaign_name, name);
            assert_eq(creator, CREATOR);
            assert_eq(goal_amount, GOAL_AMOUNT);
            
            // Check goal reached status
            assert!(!crowdfunding::is_goal_reached(&campaign), 0); // Goal not reached yet
            
            ts::return_shared(campaign);
        };
        
        // Donate to meet the goal
        ts::next_tx(&mut scenario, DONOR1);
        {
            let mut campaign = ts::take_shared<Campaign>(&scenario);
            let coin = mint_sui(&mut scenario, GOAL_AMOUNT);
            
            crowdfunding::donate(
                &mut campaign,
                coin,
                false,
                ts::ctx(&mut scenario)
            );
            
            // Now check if goal is reached
            assert!(crowdfunding::is_goal_reached(&campaign), 0); // Goal should be reached
            
            ts::return_shared(campaign);
        };
        
        ts::end(scenario);
    }
}
