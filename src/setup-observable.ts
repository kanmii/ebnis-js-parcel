import { Observable, ZenObservable } from "zen-observable-ts";
import { ConnectionStatus } from "./state/connection.resolver";

export enum EmitAction {
  connectionChanged = "@emit-action/connection-changed"
}

interface EmitPayload {
  type: EmitAction;
  data: ConnectionStatus;
}

let observable: Observable<EmitPayload>;

let emitter: ZenObservable.SubscriptionObserver<EmitPayload>;

function makeObservable() {
  observable = new Observable<EmitPayload>(observer => {
    emitter = observer;
  });
}

export function emitData(params: EmitPayload) {
  if (!observable) {
    makeObservable();
  }

  if (emitter) {
    emitter.next(params);
  }
}

export function getObservable() {
  if (observable) {
    return observable;
  }

  makeObservable();

  return observable;
}