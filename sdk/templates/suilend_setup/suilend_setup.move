#[allow(lint(self_transfer))]
module suilend::setup {
    use sui::clock::{Self, Clock};
    use sui::coin::{CoinMetadata, Coin};
    use suilend::reserve_config::{Self, ReserveConfig};
    use suilend::lending_market::{Self, create_lending_market, LendingMarketOwnerCap, LendingMarket};
    use pyth::price_info::{Self, PriceInfoObject};
    use pyth::price;
    use pyth::price_feed;
    use pyth::price_identifier;
    use pyth::i64;

    public fun setup_reserve<P, T>(
        lending_market: &mut LendingMarket<P>,
        owner_cap: &mut LendingMarketOwnerCap<P>,
        type_to_index: u64,
        meta: &CoinMetadata<T>,
        config: ReserveConfig,
        depo: Coin<T>,
        price: &PriceInfoObject,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        lending_market::add_reserve<P, T>(
            owner_cap,
            lending_market,
            price,
            default_reserve_config(ctx),
            meta,
            clock,
            ctx
        );


        let ctokens = lending_market::deposit_liquidity_and_mint_ctokens<P, T>(
            lending_market,
            type_to_index,
            clock,
            depo,
            ctx
        );

        lending_market::update_reserve_config<P, T>(
            owner_cap,
            lending_market,
            type_to_index,
            config
        );

        transfer::public_transfer(ctokens, ctx.sender());
    }

    public fun reserve_args(
        open_ltv_pct: u8,
        close_ltv_pct: u8,
        max_close_ltv_pct: u8,
        set_interest_rate_apr_0: u64,
        set_interest_rate_apr_1: u64,
        ctx: &mut TxContext
    ): ReserveConfig {
        let config = default_reserve_config(ctx);
        let mut builder = reserve_config::from(&config, ctx);
        reserve_config::set_open_ltv_pct(&mut builder, open_ltv_pct);
        reserve_config::set_close_ltv_pct(&mut builder, close_ltv_pct);
        reserve_config::set_max_close_ltv_pct(&mut builder, max_close_ltv_pct);
        reserve_config::set_interest_rate_aprs(&mut builder, vector[set_interest_rate_apr_0, set_interest_rate_apr_1]);
        
        reserve_config::destroy(config);

        reserve_config::build(builder, ctx)
    }

    public fun default_price_info_obj(
        idx: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ): PriceInfoObject {
        new_price_info_obj(0, 0, idx, clock, ctx)
    }

    public fun new_price_info_obj(
        price: u64,
        expo: u8,
        idx: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ): PriceInfoObject {
        let mut v = vector::empty<u8>();
        vector::push_back(&mut v, idx);

        let mut i = 1;
        while (i < 32) {
            vector::push_back(&mut v, 0);
            i = i + 1;
        };

        price_info::new_price_info_object_for_testing(
            price_info::new_price_info(
                0,
                0,
                price_feed::new(
                    price_identifier::from_byte_vec(v),
                    price::new(
                        i64::new(price, false),
                        0,
                        i64::new((expo as u64), false),
                        clock::timestamp_ms(clock) / 1000
                    ),
                    price::new(
                        i64::new(price, false),
                        0,
                        i64::new((expo as u64), false),
                        clock::timestamp_ms(clock) / 1000
                    )
                )
            ),
            ctx
        )
    }

    public fun default_reserve_config(ctx: &mut TxContext): ReserveConfig {
        let config = reserve_config::create_reserve_config(
            // open ltv pct
            0,
            // close ltv pct
            0,
            // max close ltv pct
            0,
            // borrow weight bps
            10_000,
            // deposit_limit
            18_446_744_073_709_551_615,
            // borrow_limit
            18_446_744_073_709_551_615,
            // liquidation bonus pct
            0,
            // max liquidation bonus pct
            0,
            // deposit_limit_usd
            18_446_744_073_709_551_615,
            // borrow_limit_usd
            18_446_744_073_709_551_615,
            // borrow fee bps
            0,
            // spread fee bps
            0,
            // liquidation fee bps
            0,
            // utils
            {
                let mut v = vector::empty();
                vector::push_back(&mut v, 0);
                vector::push_back(&mut v, 100);
                v
            },
            // aprs
            {
                let mut v = vector::empty();
                vector::push_back(&mut v, 0);
                vector::push_back(&mut v, 0);
                v
            },
            false,
            18_446_744_073_709_551_615,
            18_446_744_073_709_551_615,
            ctx
        );

        config
    }
}
