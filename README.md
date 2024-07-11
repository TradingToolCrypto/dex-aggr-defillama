blocked by dexscreener 
functions using their api  
getSandwichList() 
getTopTokensByChain()

### Running the app locally

```
yarn install
yarn dev
```

Visit: http://localhost:3000/

## Tech Stack

- "@rainbow-me/rainbowkit": "^0.7.1",
- "wagmi": "^0.7.5"
- "ethers": "^5.7.1",
- "echarts": "^5.4.1",

### Join the community & report bugs

If you wish to report an issue, please join our [Discord](https://discord.swap.defillama.com/)

If you want to learn about LlamaSwap, read the [Twitter Thread](https://twitter.com/DefiLlama/status/1609989799653285888)

## changes

- removed POST to defillama on swap Events (privacy)
- cleanup UI

## Learning the codebase

https://blastapi.io/pricing

- uses blastapi ( rpc provider : requires $INFRA tokens ) :
- - moonrivers default rpc provider
- - useEstimateGas.ts:61 Error: bad response (status=400) when connected to #BSC

Fetch Quotes Server API backend `/server`
https://swap-api.defillama.com/dexAggregatorQuote?protocol=Matcha/0x&chain=polygon&from=0x0000000000000000000000000000000000000000&to=0xb5c064f955d8e7f38fe0460c556a72987494ee17&amount=1000000000000000000

- add project name in .env
