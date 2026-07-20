---
name: wallet-chat-and-community
description: Use when implementing account-scoped wallet displays, messaging, conversations, moderation, or community interactions.
---

# Bound Interactive Account Features

1. Inspect account authorization, wallet ledger or balance authority, conversation membership, message storage, real-time transport, moderation, rate limits, retention, and tests.
2. Implement the smallest requested interaction. Treat wallet values as server-authoritative derived state; never make client-side balance changes equivalent to payment or settlement.
3. Enforce conversation membership and object ownership on every read, send, edit, and delete. Bound message size and type, escape output, rate-limit abuse, and reuse existing moderation/reporting conventions.
4. Define delivery, unread, ordering, retry, and deletion semantics from the actual storage/transport contract. Do not fabricate presence, delivery, balance, or settlement success.
5. Test cross-account access, duplicate sends, ordering, reconnects, invalid content, abuse bounds, empty history, and sanitized success paths.

Report authorization and persistence evidence plus unsupported settlement, realtime, encryption, or moderation limitations.
