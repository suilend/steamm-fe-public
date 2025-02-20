module steamm::setup;

use sui::coin::{CoinMetadata, TreasuryCap};
use sui::clock::Clock;
use steamm::b_sui::B_SUI;
use steamm::b_usdc::B_USDC;
use steamm::bank;
use steamm::cpmm;
use steamm::lp_usdc_sui::LP_USDC_SUI;
use steamm::registry::Registry;
use steamm::sui::SUI;
use steamm::usdc::USDC;
use suilend::lending_market_registry::{Self as lending, Registry as LendingRegistry};
use suilend::lending_market;
use suilend::setup as suilend_setup;

public struct LENDING_MARKET has drop {}

#[allow(lint(self_transfer, share_owned))]
public fun setup(
    lending_registry: &mut LendingRegistry,
    // STEAMM Pool
    registry: &mut Registry,
    meta_lp_usdc_sui: &mut CoinMetadata<LP_USDC_SUI>,
    lp_treasury: TreasuryCap<LP_USDC_SUI>,
    // STEAMM Bank
    meta_usdc: &CoinMetadata<USDC>,
    meta_sui: &CoinMetadata<SUI>,
    meta_b_usdc: &mut CoinMetadata<B_USDC>,
    meta_b_sui: &mut CoinMetadata<B_SUI>,
    b_usdc_treasury: TreasuryCap<B_USDC>,
    b_sui_treasury: TreasuryCap<B_SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let (lending_cap, mut lending_market) = lending::create_lending_market<LENDING_MARKET>(
        lending_registry,
        ctx,
    );

    // Reserve configs
    let sui_conf = suilend_setup::default_reserve_config(20, 50, ctx);
    let usdc_conf = suilend_setup::default_reserve_config(50, 80, ctx);

    let sui_price_obj = suilend_setup::new_price_info_obj(
        3, // price
        0, // exp
        0,
        clock,
        ctx,
    );

    let usdc_price_obj = suilend_setup::new_price_info_obj(
        1, // price
        0, // exp
        1,
        clock,
        ctx,
    );

    // Add SUI reserve
    lending_market::add_reserve<LENDING_MARKET, SUI>(
        &lending_cap,
        &mut lending_market,
        &sui_price_obj,
        sui_conf,
        meta_sui,
        clock,
        ctx,
    );
    
    // Add USDC reserve
    lending_market::add_reserve<LENDING_MARKET, USDC>(
        &lending_cap,
        &mut lending_market,
        &usdc_price_obj,
        usdc_conf,
        meta_usdc,
        clock,
        ctx,
    );

    let pool = cpmm::new<B_USDC, B_SUI, LP_USDC_SUI>(
        registry,
        100,
        0,
        meta_b_usdc,
        meta_b_sui,
        meta_lp_usdc_sui,
        lp_treasury,
        ctx,
    );

    bank::create_bank_and_share<LENDING_MARKET, USDC, B_USDC>(
        registry,
        meta_usdc,
        meta_b_usdc,
        b_usdc_treasury,
        &lending_market,
        ctx,
    );

    bank::create_bank_and_share<LENDING_MARKET, SUI, B_SUI>(
        registry,
        meta_sui,
        meta_b_sui,
        b_sui_treasury,
        &lending_market,
        ctx,
    );

    sui::transfer::public_share_object(lending_market);
    sui::transfer::public_share_object(pool);
    sui::transfer::public_transfer(lending_cap, ctx.sender());
    sui::transfer::public_transfer(usdc_price_obj, ctx.sender());
    sui::transfer::public_transfer(sui_price_obj, ctx.sender());
}
