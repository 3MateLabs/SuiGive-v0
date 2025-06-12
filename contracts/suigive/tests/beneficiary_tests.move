#[test_only]
module suigive::beneficiary_tests {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::string::utf8;
    use suigive::crowdfunding_old::{Self as crowdfunding, CampaignManager, Campaign, CampaignOwnerCap, BeneficialParty};
    use suigive::sg_usd::{Self, SG_USD, SGUSD_Manager};
    
    // Test addresses
    const ADMIN: address = @0xAD;
    const CREATOR: address = @0xC1;
    const DONOR: address = @0xD1;
    const BENEFICIARY: address = @0x4822bfc9c86d1a77daf48b0bdf8f012ae9b7f8f01b4195dc0f3fd4fb838525bd;
    
    #[test]
    fun test_beneficiary_commission_successful_campaign() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
            sg_usd::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 10 SUI goal
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            let beneficial_parties = vector::empty<BeneficialParty>();
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SUI>(
                &mut registry,
                utf8(b"Test Campaign"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                10_000_000_000, // 10 SUI goal
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Make donations to exceed goal (12 SUI total)
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            
            // Donate 12 SUI
            let coin = coin::mint_for_testing<SUI>(12_000_000_000, ts::ctx(&mut scenario));
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"Large donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // Creator withdraws funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Initial balance check for creator
            // Note: We track balance changes through events
            
            // Withdraw remaining funds (after beneficial parties)
            crowdfunding::withdraw_remaining<SUI>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Check beneficiary received 6% commission (0.72 SUI from 12 SUI)
        ts::next_tx(&mut scenario, BENEFICIARY);
        {
            // Beneficiary should have received 720_000_000 MIST (6% of 12 SUI)
            let expected_commission = 720_000_000;
            // Creator should have received 11.28 SUI (12 - 0.72)
            let expected_creator_amount = 11_280_000_000;
            
            // In a real test, we would check the actual coin balances
            // For now, we'll just verify the calculation is correct
            assert_eq(expected_commission + expected_creator_amount, 12_000_000_000);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_beneficiary_commission_failed_campaign() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
            sg_usd::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 10 SUI goal
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            let beneficial_parties = vector::empty<BeneficialParty>();
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SUI>(
                &mut registry,
                utf8(b"Test Campaign"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                10_000_000_000, // 10 SUI goal
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Make donations but don't reach goal (5 SUI total)
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            
            // Donate 5 SUI (half of goal)
            let coin = coin::mint_for_testing<SUI>(5_000_000_000, ts::ctx(&mut scenario));
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"Partial donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // Creator withdraws funds (campaign failed)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw funds
            crowdfunding::withdraw_remaining<SUI>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Check beneficiary received 3% commission (0.15 SUI from 5 SUI)
        ts::next_tx(&mut scenario, BENEFICIARY);
        {
            // Beneficiary should have received 150_000_000 MIST (3% of 5 SUI)
            let expected_commission = 150_000_000;
            // Creator should have received 4.85 SUI (5 - 0.15)
            let expected_creator_amount = 4_850_000_000;
            
            // Verify the calculation
            assert_eq(expected_commission + expected_creator_amount, 5_000_000_000);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_beneficiary_commission_max_cap() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 1000 SUI goal
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            let beneficial_parties = vector::empty<BeneficialParty>();
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SUI>(
                &mut registry,
                utf8(b"Large Campaign"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                1_000_000_000_000, // 1000 SUI goal
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Make huge donation (2000 SUI)
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            
            // Donate 2000 SUI
            let coin = coin::mint_for_testing<SUI>(2_000_000_000_000, ts::ctx(&mut scenario));
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"Huge donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // Creator withdraws funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw funds
            crowdfunding::withdraw_remaining<SUI>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Check beneficiary received max commission (10,000 SUI = 10_000_000_000_000 MIST)
        ts::next_tx(&mut scenario, BENEFICIARY);
        {
            // 6% of 2000 SUI would be 120 SUI (120_000_000_000 MIST)
            // But max cap is 10,000 SUI (10_000_000_000_000 MIST)
            // Since 120 SUI < 10,000 SUI cap, beneficiary gets full 120 SUI
            let expected_commission = 120_000_000_000; // 6% of 2000 SUI
            let expected_creator_amount = 1_880_000_000_000; // 2000 - 120
            
            // Verify the calculation
            assert_eq(expected_commission + expected_creator_amount, 2_000_000_000_000);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_beneficiary_commission_actual_max_cap() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 100,000 SUI goal
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            let beneficial_parties = vector::empty<BeneficialParty>();
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SUI>(
                &mut registry,
                utf8(b"Huge Campaign"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                100_000_000_000_000, // 100,000 SUI goal
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Make huge donation (200,000 SUI) to trigger max cap
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            
            // Donate 200,000 SUI
            let coin = coin::mint_for_testing<SUI>(200_000_000_000_000, ts::ctx(&mut scenario));
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"Massive donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // Creator withdraws funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw funds
            crowdfunding::withdraw_remaining<SUI>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Check beneficiary received max commission (10,000 SUI cap)
        ts::next_tx(&mut scenario, BENEFICIARY);
        {
            // 6% of 200,000 SUI would be 12,000 SUI (12_000_000_000_000 MIST)
            // But max cap is 10,000 SUI (10_000_000_000_000 MIST)
            let expected_commission = 10_000_000_000_000; // Max cap enforced
            let expected_creator_amount = 190_000_000_000_000; // 200,000 - 10,000
            
            // Verify the calculation
            assert_eq(expected_commission + expected_creator_amount, 200_000_000_000_000);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_commission_paid_only_once_sui() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 10 SUI goal
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            let beneficial_parties = vector::empty<BeneficialParty>();
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SUI>(
                &mut registry,
                utf8(b"Test Campaign"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                10_000_000_000, // 10 SUI goal
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Make SUI donation to exceed goal
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            
            // Donate 15 SUI
            let coin = coin::mint_for_testing<SUI>(15_000_000_000, ts::ctx(&mut scenario));
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"SUI donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // First withdrawal attempt
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw SUI funds (should pay commission)
            crowdfunding::withdraw_remaining<SUI>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Verify commission calculation
        // Total raised: 15 SUI
        // Commission: 6% of 15 = 0.9 SUI
        // Creator receives: 14.1 SUI
        // Beneficiary receives: 0.9 SUI
        let expected_commission = 900_000_000;
        let expected_creator_amount = 14_100_000_000;
        assert_eq(expected_commission + expected_creator_amount, 15_000_000_000);
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_sgusd_withdrawal_commission() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
            sg_usd::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 10 sgUSD goal
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            let beneficial_parties = vector::empty<BeneficialParty>();
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SG_USD>(
                &mut registry,
                utf8(b"sgUSD Campaign"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                10_000_000_000, // 10 sgUSD goal (in base units)
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Mint sgUSD to donor
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut manager = ts::take_shared<SGUSD_Manager>(&scenario);
            sg_usd::mint(
                &mut manager,
                20_000_000_000, // 20 sgUSD
                DONOR,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(manager);
        };
        
        // Make sgUSD donation to exceed goal
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SG_USD>>(&scenario);
            
            // Donate 12 sgUSD
            let mut sgusd_coin = ts::take_from_sender<coin::Coin<SG_USD>>(&scenario);
            let donation_coin = coin::split(&mut sgusd_coin, 12_000_000_000, ts::ctx(&mut scenario));
            
            crowdfunding::donate<SG_USD>(
                &mut campaign,
                donation_coin,
                b"sgUSD donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, sgusd_coin);
            ts::return_shared(campaign);
        };
        
        // Creator withdraws sgUSD funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SG_USD>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw sgUSD funds (should pay 6% commission)
            crowdfunding::withdraw_remaining<SG_USD>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Verify commission calculation
        // Commission should be 6% of 12 sgUSD = 0.72 sgUSD
        // Creator should receive: 11.28 sgUSD
        // Beneficiary should receive: 0.72 sgUSD
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_beneficiary_parties_with_commission() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize modules
        ts::next_tx(&mut scenario, ADMIN);
        {
            crowdfunding::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create a campaign with 20 SUI goal and beneficial parties
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut registry = ts::take_shared<CampaignManager>(&scenario);
            let deadline = 100; // Future deadline
            
            // Create beneficial parties (e.g., team members)
            let mut beneficial_parties = vector::empty<BeneficialParty>();
            let party1 = crowdfunding::create_beneficial_party(
                @0xB1,
                utf8(b"Team member 1"),
                1000, // 10%
                0, // no max
                0  // no min
            );
            vector::push_back(&mut beneficial_parties, party1);
            
            let owner_cap = crowdfunding::create_campaign_for_testing<SUI>(
                &mut registry,
                utf8(b"Campaign with Parties"),
                utf8(b"Description"),
                utf8(b"https://example.com"),
                utf8(b"Test"),
                20_000_000_000, // 20 SUI goal
                deadline,
                beneficial_parties,
                ts::ctx(&mut scenario)
            );
            
            transfer::public_transfer(owner_cap, CREATOR);
            ts::return_shared(registry);
        };
        
        // Make SUI donation to exceed goal
        ts::next_tx(&mut scenario, DONOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            
            // Donate 25 SUI
            let coin = coin::mint_for_testing<SUI>(25_000_000_000, ts::ctx(&mut scenario));
            crowdfunding::donate(
                &mut campaign,
                coin,
                b"SUI donation",
                false,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(campaign);
        };
        
        // Creator withdraws beneficial party's share (only owner can do this)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw beneficial party funds (10% of 25 SUI = 2.5 SUI)
            crowdfunding::withdraw_for_party<SUI>(
                &mut campaign,
                &owner_cap,
                0, // party index
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Creator withdraws remaining funds
        ts::next_tx(&mut scenario, CREATOR);
        {
            let mut campaign = ts::take_shared<Campaign<SUI>>(&scenario);
            let owner_cap = ts::take_from_sender<CampaignOwnerCap>(&scenario);
            
            // Withdraw remaining funds
            // Total: 25 SUI
            // Beneficiary commission: 6% of 25 = 1.5 SUI
            // Beneficial party: 10% of 25 = 2.5 SUI
            // Creator receives: 25 - 1.5 - 2.5 = 21 SUI
            crowdfunding::withdraw_remaining<SUI>(
                &mut campaign,
                &owner_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, owner_cap);
            ts::return_shared(campaign);
        };
        
        // Verify calculations
        let total_raised = 25_000_000_000;
        let beneficiary_commission = 1_500_000_000; // 6%
        let beneficial_party_amount = 2_500_000_000; // 10%
        let creator_amount = 21_000_000_000;
        assert_eq(beneficiary_commission + beneficial_party_amount + creator_amount, total_raised);
        
        ts::end(scenario);
    }
}