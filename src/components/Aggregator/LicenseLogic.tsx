import { useRef, useState, useEffect } from 'react';

import { useMutation } from '@tanstack/react-query';
import {
	useAccount,
	useBlockNumber,
	useContractRead,
	useContractWrite,
	useFeeData,
	useNetwork,
	usePrepareContractWrite,
	useQueryClient,
	useSigner,
	useSwitchNetwork
} from 'wagmi';

import { useAddRecentTransaction, useConnectModal } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { ArrowDown } from 'react-feather';
import styled from 'styled-components';
import {
	Heading,
	useToast,
	Button,
	Flex,
	Box,
	IconButton,
	Text,
	ToastId,
	Alert,
	AlertIcon,
	Image,
	VStack,
	Link
} from '@chakra-ui/react';

import { TransactionModal } from '../TransactionModal';

import { CLAIM_ABI } from './claimAbi';
import { chainToId } from './adapters/llamazip';

import { useLocalStorage } from '~/hooks/useLocalStorage';
i

const Body = styled.div<{ showRoutes: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 16px;
	width: 100%;
	max-width: 30rem;
	border: 1px solid #2f333c;
	align-self: flex-start;

	z-index: 1;

	@media screen and (min-width: ${({ theme }) => theme.bpLg}) {
		position: sticky;
		top: 24px;
	}

	box-shadow: ${({ theme }) =>
		theme.mode === 'dark'
			? '10px 0px 50px 10px rgba(26, 26, 26, 0.9);'
			: '10px 0px 50px 10px rgba(211, 211, 211, 0.9);;'};

	border-radius: 16px;
	text-align: left;
`;

const Wrapper = styled.div`
	width: 100%;
	height: 100%;
	min-height: 100%;
	text-align: center;
	display: flex;
	flex-direction: column;
	grid-row-gap: 24px;
	margin: 60px auto;

	h1 {
		font-weight: 500;
	}

	#gib-img-l,
	#gib-img-r {
		display: none;
	}

	@media screen and (min-width: 768px) {
		#gib-img-l,
		#gib-img-r {
			display: initial;
		}
	}

	@media screen and (min-width: ${({ theme }) => theme.bpMed}) {
		top: 0px;
	}

	@media screen and (max-width: ${({ theme }) => theme.bpMed}) {
		flex-direction: column;
		display: flex;
	}
`;

const BodyWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	z-index: 1;
	position: relative;
	justify-content: center;

	& > * {
		margin: 0 auto;
	}

	@media screen and (min-width: ${({ theme }) => theme.bpLg}) {
		flex-direction: row;
		align-items: flex-start;
		justify-content: center;
		gap: 24px;

		& > * {
			flex: 1;
			margin: 0;
		}
	}
`;

const fromTokensList = [];
const toTokensList = [];


export function AggregatorContainer() {
	// wallet stuff
	const { data: signer } = useSigner();
	const { address, isConnected } = useAccount();
	const { chain: chainOnWallet } = useNetwork();
	const { openConnectModal } = useConnectModal();
	const { switchNetwork } = useSwitchNetwork();
	const addRecentTransaction = useAddRecentTransaction();
	const wagmiClient = useQueryClient();

	const { data: blockNumber } = useBlockNumber({
		chainId: 1,
		watch: true
	});

	// swap input fields and selected aggregator states
	const [aggregator, setAggregator] = useState('LlamaZip');

	const [isPrivacyEnabled, setIsPrivacyEnabled] = useLocalStorage('llamaswap-isprivacyenabled', false);
	const [[amount, amountOut], setAmount] = useState<[number | string, number | string]>(['10', '']);

	const [slippage, setSlippage] = useLocalStorage('arbidrop-slippage', '1');

	// post swap states
	const [txModalOpen, setTxModalOpen] = useState(false);
	const [txUrl, setTxUrl] = useState('');
	const confirmingTxToastRef = useRef<ToastId>();
	const toast = useToast();

	// debounce input amount and limit no of queries made to aggregators api, to avoid CORS errors
	const [debouncedAmount, debouncedAmountOut] = useDebounce([formatAmount(amount), formatAmount(amountOut)], 300);

	// get selected chain and tokens from URL query params
	const routesRef = useRef(null);
	const router = useRouter();
	const [{ fromTokenAddress, toTokenAddress }, setTokens] = useState({
		fromTokenAddress: ARBITRUM.address,
		toTokenAddress: ETHEREUM.address
	});

	const isValidSelectedChain = selectedChain && chainOnWallet ? selectedChain.id === chainOnWallet.id : false;
	const isOutputTrade = amountOut && amountOut !== '';

	// final tokens data
	const { finalSelectedFromToken, finalSelectedToToken } = {
		finalSelectedFromToken: fromTokenAddress === ETHEREUM.address ? ETHEREUM : ARBITRUM,
		finalSelectedToToken: toTokenAddress === ETHEREUM.address ? ETHEREUM : ARBITRUM
	};

	// format input amount of selected from token
	const amountWithDecimals = BigNumber(debouncedAmount && debouncedAmount !== '' ? debouncedAmount : '0')
		.times(BigNumber(10).pow(finalSelectedFromToken?.decimals || 18))
		.toFixed(0);
	const amountOutWithDecimals = BigNumber(debouncedAmountOut && debouncedAmountOut !== '' ? debouncedAmountOut : '0')
		.times(BigNumber(10).pow(finalSelectedToToken?.decimals || 18))
		.toFixed(0);

	// selected from token's balances
	const balance = useBalance({ address, token: finalSelectedFromToken?.address, chainId: selectedChain.id });
	// selected from token's balances
	const toTokenBalance = useBalance({ address, token: finalSelectedToToken?.address, chainId: selectedChain.id });


	const forceRefreshTokenBalance = () => {
		if (chainOnWallet && address) {
			wagmiClient.invalidateQueries([{ addressOrName: address, chainId: chainOnWallet.id, entity: 'balance' }]);
		}
	};

	// approve/swap tokens
	const amountToApprove = BigNumber(11000).times(1e18).toFixed(0);
	const amountToInfiniteApprove = BigNumber(30000).times(1e18).toFixed(0);

	const {
		isApproved,
		approve,
		approveInfinite,
		isLoading: isApproveLoading,
		isInfiniteLoading: isApproveInfiniteLoading,
		isResetLoading: isApproveResetLoading,
		isConfirmingApproval,
		isConfirmingInfiniteApproval,
		shouldRemoveApproval,
		allowance
	} = useTokenApprove(finalSelectedFromToken?.address, chainToId.arbitrum as any, amountToApprove);

	const { approve: approveNonInfinite, isLoading: isApproveNonInfiniteLoading } = useTokenApprove(
		finalSelectedFromToken?.address,
		chainToId.arbitrum as any,
		amountToInfiniteApprove
	);

	useEffect(() => {
		if (isConnected && chainOnWallet.id !== 42161) {
			switchNetwork?.(42161);
		}
	}, [chainOnWallet]);

	useEffect(() => {
		if (isConnected && chainOnWallet.id !== 42161) {
			switchNetwork?.(42161);
		}
	}, []);

	const isUSDTNotApprovedOnEthereum =
		selectedChain && finalSelectedFromToken && selectedChain.id === 1 && shouldRemoveApproval;
	

	
	
	
	const { data: claimableTokens } = useContractRead({
		address: '0x67a24CE4321aB3aF51c2D0a4801c3E111D88C9d9',
		abi: CLAIM_ABI,
		functionName: 'claimableTokens',
		args: [address]
	});

	const { config } = usePrepareContractWrite({
		address: '0x67a24CE4321aB3aF51c2D0a4801c3E111D88C9d9',
		abi: CLAIM_ABI,
		functionName: 'claim',
		enabled: isConnected,
		overrides: {
			maxFeePerGas: BigNumber(40).times(1e9).toFixed(0, 1) as any,
			maxPriorityFeePerGas: BigNumber(10).times(1e9).toFixed(0, 1) as any
		}
	});

	const { write: claim, isLoading: isClaimLoading } = useContractWrite({
		...config,
		onSuccess: () => {
			toast({
				title: 'Claimed successfully',
				status: 'success',
				duration: 10000,
				isClosable: true,
				position: 'top-right',
				containerStyle: {
					width: '100%',
					maxWidth: '300px'
				}
			});
		}
	});

	
	return (
		<Wrapper>

			<Heading fontSize="16px" marginRight={"190"}>
				<Link href="https://tradingtoolcrypto.com" isExternal padding={"4"}   >
					Home
				</Link>
				<Link href="/" padding={"4"} >
					Swap
				</Link>

				<Link href="https://license.tradingtoolcrypto.com" isExternal padding={"4"} >
					NFT Drop
				</Link>

				<Link href="https://github.com/tradingtoolcrypto" isExternal padding={"4"} >
					Docs
				</Link>
			</Heading>
			<BodyWrapper>
				{blocksTillAirdrop < 0 ? (
					<Box
						id="dexscreener-embed"
						pos="relative"
						maxW="600px"
						height="739px"
						display={{ base: 'none', lg: 'block' }}
					>
						<iframe
							style={{ position: 'absolute', width: '600px', height: '500px', top: 0, left: 0, borderRadius: '16px' }}
							src="https://dexscreener.com/arbitrum/0xbed2589fefae17d62a8a4fdac92fa5895cae90d2?embed=1&trades=0&info=0"
						></iframe>
					</Box>
				) : null}

				<Body showRoutes={finalSelectedFromToken && finalSelectedToToken ? true : false}>


					<Flex flexDir="column" gap="4px" pos="relative">
						<InputAmountAndTokenSelect
							placeholder={normalizedRoutes[0]?.amountIn}
							setAmount={setAmount}
							type="amountIn"
							amount={selectedRoute?.amountIn && amountOut !== '' ? selectedRoute.amountIn : amount}
							tokens={fromTokensList}
							token={finalSelectedFromToken}
							onSelectTokenChange={onFromTokenChange}
							selectedChain={selectedChain as any}
							balance={balance.data?.formatted}
							onMaxClick={onMaxClick}
							tokenPrice={fromTokenPrice}
							customSelect={
								<Button
									display="flex"
									gap="6px"
									flexWrap="nowrap"
									alignItems="center"
									w="100px"
									borderRadius="8px"
									bg="#222429"
									maxW={{ base: '100%', md: '9rem' }}
									p="12px"
								>
									<IconImage
										src={finalSelectedFromToken.logoURI}
										onError={(e) => (e.currentTarget.src = '/placeholder.png')}
									/>

									<Text
										as="span"
										color="white"
										overflow="hidden"
										whiteSpace="nowrap"
										textOverflow="ellipsis"
										fontWeight={400}
									>
										{finalSelectedFromToken.symbol}
									</Text>
								</Button>
							}
						/>

						<IconButton
							onClick={() =>
								setTokens((tokens) => ({
									fromTokenAddress: tokens.toTokenAddress,
									toTokenAddress: tokens.fromTokenAddress
								}))
							}
							icon={<ArrowDown size={14} />}
							aria-label="Switch Tokens"
							marginTop="auto"
							w="2.25rem"
							h="2.25rem"
							minW={0}
							p="0"
							pos="absolute"
							top="0"
							bottom="0"
							right="0"
							left="0"
							m="auto"
							borderRadius="8px"
							bg="#222429"
							_hover={{ bg: '#2d3037' }}
							color="white"
							zIndex={1}
						/>

						<InputAmountAndTokenSelect
							placeholder={normalizedRoutes[0]?.amount}
							setAmount={setAmount}
							type="amountOut"
							amount={selectedRoute?.amount && amount !== '' ? selectedRoute.amount : amountOut}
							tokens={toTokensList}
							token={finalSelectedToToken}
							onSelectTokenChange={onToTokenChange}
							selectedChain={selectedChain as any}
							balance={toTokenBalance.data?.formatted}
							tokenPrice={toTokenPrice}
							disabled
							priceImpact={selectedRoutesPriceImpact}
							customSelect={
								<Button
									display="flex"
									gap="6px"
									flexWrap="nowrap"
									alignItems="center"
									w="100px"
									borderRadius="8px"
									bg="#222429"
									maxW={{ base: '100%', md: '9rem' }}
									p="12px"
								>
									<IconImage
										src={finalSelectedToToken.logoURI}
										onError={(e) => (e.currentTarget.src = '/placeholder.png')}
									/>

									<Text
										as="span"
										color="white"
										overflow="hidden"
										whiteSpace="nowrap"
										textOverflow="ellipsis"
										fontWeight={400}
									>
										{finalSelectedToToken.symbol}
									</Text>
								</Button>
							}
						/>
					</Flex>

					<Button colorScheme={'messenger'} onClick={() => refetch?.()} w="fit-content" ml="auto">
						Refresh Price
					</Button>

					<Slippage
						slippage={slippage}
						setSlippage={setSlippage}
						fromToken={finalSelectedFromToken?.symbol}
						toToken={finalSelectedToToken?.symbol}
					/>

					{sizeIsSize ? (
						<Alert status="warning" borderRadius="0.375rem" py="8px" fontSize={'16px'}>
							<AlertIcon />
							Your size is size. Please use swap.defillama.com
						</Alert>
					) : null}

					<SwapWrapper>
						{!isConnected ? (
							<Button colorScheme={'messenger'} onClick={openConnectModal}>
								Connect Wallet
							</Button>
						) : !isValidSelectedChain ? (
							<Button colorScheme={'messenger'} onClick={() => switchNetwork(selectedChain.id)}>
								Switch Network
							</Button>
						) : insufficientBalance ? (
							<Button colorScheme={'messenger'} disabled>
								Insufficient Balance
							</Button>
						) : hasMaxPriceImpact ? (
							<Button colorScheme={'messenger'} disabled>
								Price impact is too large
							</Button>
						) : (
							<>
								{router && address && (
									<>
										<>
											{hasPriceImapct && !isLoading && selectedRoute && isApproved ? (
												<SwapConfirmation handleSwap={handleSwap} />
											) : (
												<Button
													isLoading={swapMutation.isLoading || isApproveLoading}
													loadingText={isConfirmingApproval ? 'Confirming' : 'Preparing transaction'}
													colorScheme={'messenger'}
													onClick={() => {
														//scroll Routes into view
														!selectedRoute && routesRef.current.scrollIntoView({ behavior: 'smooth' });

														if (!enoughApproval) approve();

														if (
															balance.data &&
															!Number.isNaN(Number(balance.data.value)) &&
															+selectedRoute?.fromAmount > +balance?.data?.value?.toString()
														)
															return;

														handleSwap();
													}}
													disabled={
														swapMutation.isLoading ||
														isApproveLoading ||
														isApproveResetLoading ||
														!(finalSelectedFromToken && finalSelectedToToken) ||
														insufficientBalance ||
														!selectedRoute ||
														slippageIsWong ||
														!isAmountSynced ||
														sizeIsSize ||
														fetchingTokenPrices
													}
												>
													{enoughApproval ? `Swap via LlamaZip` : slippageIsWong ? 'Set Slippage' : 'Approve'}
												</Button>
											)}

											{!isApproved && selectedRoute && inifiniteApprovalAllowed.includes(selectedRoute.name) && (
												<Button
													colorScheme={'messenger'}
													loadingText={isConfirmingInfiniteApproval ? 'Confirming' : 'Preparing transaction'}
													isLoading={isApproveInfiniteLoading}
													onClick={() => {
														if (approveInfinite) approveInfinite();
													}}
													disabled={
														isUSDTNotApprovedOnEthereum ||
														swapMutation.isLoading ||
														isApproveLoading ||
														isApproveResetLoading ||
														isApproveInfiniteLoading ||
														!selectedRoute ||
														fetchingTokenPrices
													}
												>
													{'Approve Infinite'}
												</Button>
											)}
										</>
									</>
								)}
							</>
						)}
					</SwapWrapper>
				</Body>
			</BodyWrapper>

			<TransactionModal open={txModalOpen} setOpen={setTxModalOpen} link={txUrl} />

		</Wrapper>
	);
}