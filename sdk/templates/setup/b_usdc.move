module steamm::b_usdc;

const NAME: vector<u8> = b"bToken USDC";
const SYMBOL: vector<u8> = b"bUSDC";
const DESCRIPTION: vector<u8> = b"Steamm bToken";
const DECIMALS: u8 = 9;

public struct B_USDC has drop {}

fun init(otw: B_USDC, ctx: &mut TxContext) {
    let (treasury_cap, coin_metadata) = sui::coin::create_currency(
        otw,
        DECIMALS,
        SYMBOL,
        NAME,
        DESCRIPTION,
        option::none(),
        ctx,
    );

    sui::transfer::public_transfer(treasury_cap, ctx.sender());
    sui::transfer::public_transfer(coin_metadata, ctx.sender());
}
