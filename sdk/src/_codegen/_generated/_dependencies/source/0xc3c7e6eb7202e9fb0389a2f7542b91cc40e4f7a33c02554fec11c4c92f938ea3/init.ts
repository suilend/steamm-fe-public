import * as aggregatorDeleteAction from "./aggregator-delete-action/structs";
import * as aggregatorInitAction from "./aggregator-init-action/structs";
import * as aggregatorSetAuthorityAction from "./aggregator-set-authority-action/structs";
import * as aggregatorSetConfigsAction from "./aggregator-set-configs-action/structs";
import * as aggregatorSubmitResultAction from "./aggregator-submit-result-action/structs";
import * as aggregator from "./aggregator/structs";
import * as decimal from "./decimal/structs";
import * as guardianQueueInitAction from "./guardian-queue-init-action/structs";
import * as hash from "./hash/structs";
import * as onDemand from "./on-demand/structs";
import * as oracleAttestAction from "./oracle-attest-action/structs";
import * as oracleInitAction from "./oracle-init-action/structs";
import * as oracleQueueInitAction from "./oracle-queue-init-action/structs";
import * as oracle from "./oracle/structs";
import * as queueAddFeeCoinAction from "./queue-add-fee-coin-action/structs";
import * as queueOverrideOracleAction from "./queue-override-oracle-action/structs";
import * as queueRemoveFeeCoinAction from "./queue-remove-fee-coin-action/structs";
import * as queueSetAuthorityAction from "./queue-set-authority-action/structs";
import * as queueSetConfigsAction from "./queue-set-configs-action/structs";
import * as queue from "./queue/structs";
import * as setGuardianQueueIdAction from "./set-guardian-queue-id-action/structs";
import * as setOracleQueueIdAction from "./set-oracle-queue-id-action/structs";
import * as setPackageIdAction from "./set-package-id-action/structs";
import {StructClassLoader} from "../../../_framework/loader";

export function registerClasses(loader: StructClassLoader) { loader.register(decimal.Decimal);
loader.register(aggregator.Aggregator);
loader.register(aggregator.CurrentResult);
loader.register(aggregator.Update);
loader.register(aggregator.UpdateState);
loader.register(aggregatorDeleteAction.AggregatorDeleted);
loader.register(queue.ExistingOracle);
loader.register(queue.Queue);
loader.register(aggregatorInitAction.AggregatorCreated);
loader.register(aggregatorSetAuthorityAction.AggregatorAuthorityUpdated);
loader.register(aggregatorSetConfigsAction.AggregatorConfigsUpdated);
loader.register(oracle.Oracle);
loader.register(oracle.Attestation);
loader.register(hash.Hasher);
loader.register(aggregatorSubmitResultAction.AggregatorUpdated);
loader.register(guardianQueueInitAction.GuardianQueueCreated);
loader.register(onDemand.State);
loader.register(onDemand.AdminCap);
loader.register(onDemand.ON_DEMAND);
loader.register(oracleAttestAction.AttestationCreated);
loader.register(oracleAttestAction.AttestationResolved);
loader.register(oracleInitAction.OracleCreated);
loader.register(oracleQueueInitAction.OracleQueueCreated);
loader.register(queueAddFeeCoinAction.QueueFeeTypeAdded);
loader.register(queueOverrideOracleAction.QueueOracleOverride);
loader.register(queueRemoveFeeCoinAction.QueueFeeTypeRemoved);
loader.register(queueSetAuthorityAction.QueueAuthorityUpdated);
loader.register(queueSetConfigsAction.QueueConfigsUpdated);
loader.register(setGuardianQueueIdAction.GuardianQueueIdSet);
loader.register(setOracleQueueIdAction.OracleQueueIdSet);
loader.register(setPackageIdAction.OnDemandPackageIdSet);
 }
