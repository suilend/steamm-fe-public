import * as poolScript from "./pool-script/structs";
import * as scriptEvents from "./script-events/structs";
import {StructClassLoader} from "../_framework/loader";

export function registerClasses(loader: StructClassLoader) {
    loader.register(scriptEvents.Event);
    loader.register(poolScript.MultiRouteSwapQuote);
}
