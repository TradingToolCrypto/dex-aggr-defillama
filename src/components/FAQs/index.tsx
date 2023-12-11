import {
	Accordion,
	AccordionButton,
	AccordionIcon,
	AccordionItem,
	AccordionPanel,
	Box,
	Text,
	Link
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
export default function FAQ() {
	return (
		<>
			<Accordion allowMultiple margin={'0 auto'} style={{ width: '100%', maxWidth: '600px' }}>
				<AccordionItem>
					<h2>
						<AccordionButton>
							<Box flex="1" textAlign="left">
								...
							</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>

					<AccordionPanel pb={4}>
						<b>What does it do?</b>
					</AccordionPanel>

					<AccordionPanel pb={4}>
						It's an aggregator of DEX aggregators, we query the price in 1inch, cowswap, matcha... and then offer you
						the best price among all of them.
					</AccordionPanel>

					<AccordionPanel pb={4}>
						<b>Is it safe?</b>
					</AccordionPanel>

					<AccordionPanel pb={4}>
						Our aggregator uses the router contract of each aggregator, we don't use any contracts developed by us. Thus
						you inherit the same security you'd get by swapping directly from their UI instead of ours.
					</AccordionPanel>

					<AccordionPanel pb={4}>
						<b>Trading Resources</b>
					</AccordionPanel>

					<AccordionPanel pb={4}>
						<Link href="/token-liquidity">Token Liquidity</Link>
						<br></br>
						<Link href="/arb">Charts</Link>
						<br></br>
						<Link href="https://www.coinglass.com/pro/futures/LiquidationMap" isExternal>
							Liquidation Map <ExternalLinkIcon mx="2px" />
						</Link>
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
		</>
	);
}
