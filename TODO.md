# TODO: Multi-currency Wallet and Trading Feature Implementation

## Phase 1: Backend (API and Service)
- [ ] Review wallet API (server/routes/wallet.js) and confirm it supports multi-currency as is.
- [ ] Confirm trading execution API (server/routes/trading.js) correctness; add minimal non-breaking enhancements if needed.
- [ ] Add or extend backend API endpoints if needed for currency exchange or wallet operations without breaking existing ones.

## Phase 2: Frontend Wallet UI Updates
- [ ] Update WalletCard.tsx to display both THB and USD balances.
- [ ] Update DepositDialog.tsx to support currency selection (THB/USD) and call deposit API accordingly.
- [ ] Update WithdrawDialog.tsx similarly for withdrawal with currency selector and validations.
- [ ] Create a new ExchangeDialog.tsx for currency exchange UI and logic.

## Phase 3: Frontend Trading UI Creation
- [ ] Create a new TradePanel.tsx component:
  - Display bid/ask prices with PriceCard or inline
  - Input for amount to buy/sell
  - Select buy or sell action
  - Show relevant currency for the gold type (THB/USD)
  - Confirm button calling trade execution API
  - Error/success feedback and wallet update triggers

## Phase 4: Integration and Page Updates
- [ ] Add TradePanel component alongside GoldChart in app/gold/[goldType]/page.tsx for full trading page.
- [ ] Connect WalletCard and dialogs to new APIs and update state on success.

## Phase 5: Testing
- [ ] Write unit tests for new frontend components and API calls.
- [ ] Integration tests for wallet and trade flows.
- [ ] Manual end-to-end tests for buy/sell, deposit/withdraw, exchange operations.

---

Notes:  
- Do not modify or refactor existing wallet and trading routes or frontend flows to avoid breaking current code.  
- Implement new features in isolated or extended components and APIs where possible.  
- Ensure backward compatibility with existing wallet balance and trading logic.  

Ready to start with Phase 1 backend review and minimal enhancements if needed.
