module steamm::b_sui;

const NAME: vector<u8> = b"bToken SUI";
const SYMBOL: vector<u8> = b"bSUI";
const DESCRIPTION: vector<u8> = b"Steamm bToken";
const DECIMALS: u8 = 9;

public struct B_SUI has drop {}

fun init(otw: B_SUI, ctx: &mut TxContext) {
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
