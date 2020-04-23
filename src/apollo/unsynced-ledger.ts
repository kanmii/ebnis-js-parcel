/* istanbul ignore file */
import gql from "graphql-tag";
import {
  UnsyncedLedger,
  UnsyncedLedgerItem,
} from "../utils/unsynced-ledger.types";

const UNSYNCED_LEDGER_QUERY = gql`
  query {
    unsyncedLedger @client
  }
`;

export function writeUnsyncedExperience(id: string, data: UnsyncedLedgerItem) {
  const unsyncedLedger = getUnsyncedLedger();
  unsyncedLedger[id] = data;
  writeUnsyncedLedger(unsyncedLedger);
}

export function getUnsyncedExperience(id: string): UnsyncedLedgerItem | null {
  const unsyncedLedger = getUnsyncedLedger();
  return unsyncedLedger[id] || null;
}

export function removeUnsyncedExperience(id: string) {
  const unsyncedLedger = getUnsyncedLedger();
  delete unsyncedLedger[id];
  writeUnsyncedLedger(unsyncedLedger);
}

export function removeUnsyncedExperiences(ids: string[]) {
  const unsyncedLedger = getUnsyncedLedger();

  ids.forEach(id => {
    delete unsyncedLedger[id];
  });

  writeUnsyncedLedger(unsyncedLedger);
}

function writeUnsyncedLedger(unsyncedLedger: UnsyncedLedger) {
  const { cache } = window.____ebnis;
  cache.writeData({
    data: {
      unsyncedLedger,
    },
  });
}

function getUnsyncedLedger() {
  const { cache } = window.____ebnis;
  const data = cache.readQuery<UnsyncedLedgerQueryResult>({
    query: UNSYNCED_LEDGER_QUERY,
  });

  return data ? data.unsyncedLedger : {};
}

interface UnsyncedLedgerQueryResult {
  unsyncedLedger: UnsyncedLedger;
}
