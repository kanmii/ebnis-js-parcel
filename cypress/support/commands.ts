declare namespace Cypress {
  interface Chainable {
    /**
     *
     */
    checkoutSession: () => Chainable<Promise<void>>;

    /**
     *
     */
    setConnectionStatus: (isConnected: boolean) => void;
  }
}
