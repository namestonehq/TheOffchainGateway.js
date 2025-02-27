# TheOffchainGateway.js

Offchain CCIP-Read Gateway in JS powered by [**ezccip.js**](https://github.com/namestone/ezccip.js/) and [**TheOffchainResolver.sol**](https://github.com/resolverworks/TheOffchainResolver.sol)

## Instructions

- `npm i`
- Create `.env` from [`.env.example`](./.env.example)
- By default, [`config.js`](./config.js) includes many [demo routers](#demos)
  - Enabled with env `DEMO=1` (default)
- Start server: `npm run start`
  - Configuration available at [`http://localhost:$PORT/`](https://raffy.xyz/tog/)
- [Setup **TOR**](https://github.com/resolverworks/TheOffchainResolver.sol#context-format)

## Routers

```ts
type Router {
	// endpoint path component
	slug: string;

	// called during server start
	init?(ezccip: EZCCIP): Promise<void>;

	// ENS request handler
	resolve?(
		name: string, // "raffy.eth"
		context: Context,
		history: History  // current history object
	): Promise<Record | undefined>;
}
type Context = {
	sender: string; // address of calling contract (TOR or wrapper)
	resolver: string; // address of receiving contract (TOR)
	calldata: string; // calldata of request
	router: Router; // the current router
	routers: Map<string, Router>; // available routers
	history: History; // root history object
	ip: string; // ip address of client
}
```

- `POST` Endpoints:
  - `http://localhost:$PORT/fixed` &rarr; router with slug `"fixed"` and uses **Mainnet TOR** (default)
  - `http://localhost:$PORT/fixed/s` uses **Sepolia TOR** &mdash; see [config.js](./config.js)
- see `EZCCIP`, `CallContext`, and `History` from [resolverworks/**ezccip**](https://github.com/namestone/ezccip.js/blob/main/dist/index.d.ts)
- see `Record`, `Profile`, `Node` from [resolverworks/**enson**](https://github.com/resolverworks/enson.js/blob/main/dist/index.d.ts)
- TOR-invoked [ENSIP-10](https://docs.ens.domains/ensip/10) requests are handled by `resolve()`
- Arbitrary [EIP-3668](https://eips.ethereum.org/EIPS/eip-3668) requests can be registered during `init()`
- You may host multiple independent routers simultaneously.
- [MultiRouter](./src/MultiRouter.js) dispatches requests to another router where `subdomain = slug`
  - Example: `/multi` + `"a.b.flat.c.d"` &rarr; `/flat` + `"a.b"`
  - Enabled with env `MULTI=1` (default)

## Demos

_The following are hosted under `tog.raffy.eth` using a `MultiRouter`_

- [Fixed Record for ALL Names](./routers/fixed.js)
  - [`fixed.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#fixed.tog.raffy.eth)
  - [`raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.xyz)
- [Random Address](./routers/random.js)
  - [`random.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#random.tog.raffy.eth)
  - [`random.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#random.raffy.xyz)
- [Simple {name: address} Database](./routers/simple.js) &rarr; [simple.json](./routers/simple.json)
  - [`carl.simple.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#carl.simple.tog.raffy.eth)
  - [`bob.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#bob.raffy.xyz)
- [Mainnet On-chain ".eth" Mirror](./routers/mirror.js) via [`MirrorRouter`](./src/MirrorRouter.js)
  - [`nick.eth.mirror.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#nick.eth.mirror.tog.raffy.eth) &harr; [`nick.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#nick.eth)
  - [`brantly.xyz.mirror.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#brantly.xyz.mirror.tog.raffy.eth) &harr;[`brantly.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#brantly.xyz)
- [Coinbase Exchange Rates](./routers/coinbase.js) &mdash; lookup crypto price, icon, name, etc.
  - [`eth.coinbase.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#eth.coinbase.tog.raffy.eth)
  - [`btc.coinbase.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#btc.coinbase.tog.raffy.eth)
- [Wikipedia](./routers/wikipedia.js) &mdash; lookup any Wikipedia article
  - [`ethereum.wiki.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#ethereum.wiki.tog.raffy.eth) &harr; [Ethereum](https://en.wikipedia.org/wiki/Ethereum)
  - [`vitalik.wiki.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#vitalik.wiki.tog.raffy.eth) &harr; [Vitalik_Buterin](https://en.wikipedia.org/wiki/Vitalik_Buterin)
- [Farcaster](./routers/farcaster.js) &mdash; fname &harr; fid
  - [`raffy.fc.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.fc.tog.raffy.eth)
  - [`fid.12555.fc.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#fid.12555.fc.tog.raffy.eth)
- [Github](./routers/github.js) &mdash; host namespace from a personal or project repo
  - [`adraffy.github.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#adraffy.github.tog.raffy.eth) &harr; [ENS.json](https://github.com/adraffy/adraffy/blob/main/ENS.json)
  - [`theoffchaingateway.js.resolverworks.github.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#theoffchaingateway.js.resolverworks.github.tog.raffy.eth) &harr; [ENS.json](./ENS.json)
- [Teamnick](./routers/teamnick.js) &mdash; [teamnick.xyz](https://teamnick.xyz/) resolver
  - [`raffy.teamnick.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.teamnick.tog.raffy.eth)
- [XCTENS Example](./routers/xctens.js) via [`XCTENSRouter`](./src/XCTENSRouter.js)
  - Cross-chain ERC-721 Subdomain Resolver + Contract &rarr; [resolverworks/**XCTENS.sol**](https://github.com/resolverworks/XCTENS.sol)
- [Unicode](./routers/unicode.js) &mdash; lookup any Unicode codepoint
  - [`0x1f4a9.unicode.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#0x1f4a9.unicode.tog.raffy.eth)
- [Emoji](./routers/emoji.js) &mdash; lookup any base-single emoji
  - [`💩.emoji.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#%F0%9F%92%A9.emoji.tog.raffy.eth)
- [ENS Registrations](./routers/ensregs.js) &mdash; latest registrations by index
  - [`ensregs.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#ensregs.tog.raffy.eth)
  - [`3.emoji.ensregs.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#3.emoji.ensregs.tog.raffy.eth)
- [Airtable](./routers/airtable.js) via [`AirtableRouter.js`](./src/AirtableRouter.js) &rarr; [demo table](https://airtable.com/appzYI39knUZdO88N/shrkNXbY8tHEFk2Ew/tbl1osSFBUef6Wjof)
  - Requires [airtable.com](https://airtable.com/) account
  - Supports any record type (using [resolverworks/**enson.js**](https://github.com/resolverworks/enson.js) notation for column name)
  - [`moo.airtable.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#moo.airtable.tog.raffy.eth)
  - [`chonk.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#air3.raffy.xyz)
- [Namespace](./routers/namespace.js) via [`createNamespace()`](./src/namespace.js) &mdash; describe a namespace in JS-object notation
  - [`chonk.raffy.eth.namespace.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#chonk.raffy.eth.namespace.tog.raffy.eth)
- [Tree](./routers/tree.js) via [`NodeRouter`](./src/NodeRouter.js) &rarr; [`tree.json`](./examples/tree.json)
  - [`tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#tree.tog.raffy.eth)
  - [`💎️.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#💎️.tree.tog.raffy.eth)
  - [`adraffy.alice.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#adraffy.alice.tree.tog.raffy.eth)
  - Supports `_`-index: [`_.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#_.tree.tog.raffy.eth)
  - Supports reverse: [`51050ec063d393217b436747617ad1c2285aeeee.addr.reverse.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#51050ec063d393217b436747617ad1c2285aeeee.addr.reverse.tree.tog.raffy.eth)
  - Automatic reload after modification
  - Automatic JSON API
    - [`/tree/`](https://raffy.xyz/tog/tree/tree)
    - [`/flat/`](https://raffy.xyz/tog/tree/flat)
    - [`/names/`](https://raffy.xyz/tog/tree/names)
    - [`/base/](https://raffy.xyz/tog/tree/base)
  - Supports multiple basenames
- [Flat](./routers/flat.js) via [NodeRouter.js](./src/NodeRouter.js) &rarr; [`flat.json`](./examples/flat.json)
  - Same as **Tree** except uses a flat data structure
  - [`raffy.flat.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.flat.tog.raffy.eth)
- [Offchain Tunnel for `fetchFlatJSON()`](./routers/tunnel.js) &mdash; an example of [resolverworks/**OffchainTunnel.sol**](https://github.com/resolverworks/TheOffchainResolver.sol?tab=readme-ov-file#offchaintunnelsol)
  - [Demo](https://raffy.antistupid.com/eth/offchain-tunnel.html) (view source)
