import { List, Button, Col, Menu, Row, Card, Progress, Spin, Divider } from "antd";
import {
  PieChartOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  SendOutlined,
  UndoOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Address,
  Balance,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
  AddressInput,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { primaryCol, softTextCol } from "./styles";
import StakerTimer from "./components/Staker/StakerTimer";
import StakerBanner from "./components/Staker/StakerBanner";
import TotalStaker from "./components/Staker/TotalStaker";
import AddStake from "./components/Staker/AddStake";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const defaultTargetNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = ["localhost", "mainnet", "rinkeby"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const selectedNetworkOption = networkOptions.includes(defaultTargetNetwork.name)
    ? defaultTargetNetwork.name
    : networkOptions[0];
  const [selectedNetwork, setSelectedNetwork] = useState(selectedNetworkOption);
  const location = useLocation();

  /// 📡 What chain are your contracts deployed to?
  const targetNetwork = NETWORKS[selectedNetwork]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  //keep track of contract balance to know how much has been staked total:
  const stakerContractBalance = useBalance(
    localProvider,
    readContracts && readContracts.Staker ? readContracts.Staker.address : null,
  );
  if (DEBUG) console.log("💵 stakerContractBalance", stakerContractBalance);

  // ** keep track of total 'threshold' needed of ETH
  const threshold = useContractReader(readContracts, "Staker", "threshold");
  console.log("💵 threshold:", threshold);

  // ** keep track of a variable from the contract in the local React state:
  const balanceStaked = useContractReader(readContracts, "Staker", "balances", [address]);
  console.log("💸 balanceStaked:", balanceStaked);

  // ** 📟 Listen for broadcast events
  const stakeEvents = useEventListener(readContracts, "Staker", "Stake", localProvider, 1);
  console.log("📟 stake events:", stakeEvents);

  // ** Listen for when the contract has been 'completed'
  const complete = useContractReader(readContracts, "ExampleExternalContract", "completed");
  console.log("✅ complete:", complete);

  // ** Listen for when the contract has been opened for withdraw
  const openForWithdraw = useContractReader(readContracts, "Staker", "openForWithdraw");
  console.log("✅ openForWithdraw:", openForWithdraw);

  // TIME
  const deadLine = useContractReader(readContracts, "Staker", "deadline");
  console.log("⏳ deadLine:", deadLine);
  const timeLeft = useContractReader(readContracts, "Staker", "timeLeft");
  console.log(" timeLeft: ", timeLeft);

  // ==== DERIVED STATE ===

  const stakerContractBalanceZero =
    stakerContractBalance && stakerContractBalance.toNumber && stakerContractBalance.eq("0");
  const userBalanceZero = balanceStaked && balanceStaked.toNumber && balanceStaked.eq("0");
  const isOver = timeLeft && ethers.BigNumber.from(0).eq(timeLeft);
  const belowThreshold =
    stakerContractBalance &&
    threshold &&
    stakerContractBalance.toNumber &&
    threshold.toNumber &&
    stakerContractBalance.lt(threshold);
  const exampleExternalContractBalance = useBalance(
    localProvider,
    readContracts && readContracts.ExampleExternalContract ? readContracts.ExampleExternalContract.address : null,
  );
  if (DEBUG) console.log("💵 exampleExternalContractBalance", exampleExternalContractBalance);

  const totalStakedValue = complete ? exampleExternalContractBalance : stakerContractBalance;
  const totalStakedValueZero = totalStakedValue && totalStakedValue.toNumber && totalStakedValue.eq("0");

  // === setup USER ACTIONS besed on CONTRACT state & UI state ===

  const showWithdrawAction = openForWithdraw && !totalStakedValueZero;
  const showStakeAction = !isOver && !complete;
  const showExecute = !complete && !openForWithdraw && isOver && !stakerContractBalanceZero;
  const executeText = belowThreshold ? "Unlock Funds " : "Execute ";
  const executeIcon = belowThreshold ? <UnlockOutlined /> : <SendOutlined />;

  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [pendingWithdrawal, setPendingWithdrawal] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState(false);

  useEffect(() => {
    if (!!address) {
      setWithdrawAddress(address);
    }
  }, [address]);
  focus(); // addressinput grabs focus, we don't want that

  const particularBalanceTitle = openForWithdraw
    ? withdrawAddress !== address
      ? "Their Balance"
      : "Your Balance"
    : "You staked";
  const particularBalanceColor = openForWithdraw ? "currentColor" : primaryCol;
  const [withdrawableBalance, setWithdrawableBalance] = useState();
  const [withdrawableBalanceError, setWithdrawableBalanceError] = useState(false);
  const withdrawableAmountZero = withdrawableBalance && withdrawableBalance.toNumber && withdrawableBalance.eq("0");
  const particularBalanceAmount = openForWithdraw ? withdrawableBalance : balanceStaked;
  useEffect(() => {
    if (!readContracts || !readContracts.Staker) return;
    const update = async () => {
      let bal;
      try {
        bal = await readContracts.Staker.balances(withdrawAddress);
        setWithdrawableBalanceError(false);
      } catch (e) {
        console.error(e);
        setWithdrawableBalanceError(true);
      }
      setWithdrawableBalance(bal);
    };
    update();
  }, [withdrawAddress, readContracts.Staker, balanceStaked]);

  // DISPLAY ONLY WHEN ALL LOADED for consistency

  const readyAll = [particularBalanceAmount, isOver, belowThreshold]
    .map(el => typeof el !== "undefined")
    .reduce((acc, el) => acc && el);

  // HACKY HACKY

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
      />
      <Menu style={{ textAlign: "center" }} selectedKeys={[location.pathname]} mode="horizontal">
        <Menu.Item key="/">
          <Link to="/">Staker UI</Link>
        </Menu.Item>
        <Menu.Item key="/debug">
          <Link to="/debug">Debug Contracts</Link>
        </Menu.Item>
      </Menu>

      <Switch>
        <Route exact path="/">
          <div style={{ padding: "2rem 1rem" }}>
            {!readyAll && (
              <div
                style={{
                  height: "70vh",
                  margin: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin size="large" />
              </div>
            )}

            {readyAll && (
              <>
                <StakerBanner
                  complete={complete}
                  failed={isOver && belowThreshold && !complete}
                  balance={stakerContractBalance}
                  externalContractBalance={exampleExternalContractBalance}
                />
                {
                  // CONTRACT
                }
                <Card
                  style={{
                    width: "35rem",
                    margin: "0 auto",
                    background: "linear-gradient(-45deg, #40A9FF0c, transparent)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        alignSelf: "center",
                        width: "100%",
                      }}
                    >
                      <div style={{ fontSize: "1.25rem" }}>Staker Contract</div>

                      <Address
                        noBlockie={true}
                        fontSize={"1.25rem"}
                        value={readContracts && readContracts.Staker && readContracts.Staker.address}
                      />
                    </div>
                    <Divider />
                    <div
                      style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: "1rem" }}
                    >
                      <div
                        style={{
                          flex: "1 1 auto",
                          alignSelf: "stretch",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {timeLeft && deadLine && <StakerTimer timeLeft={timeLeft}></StakerTimer>}
                      </div>
                      <TotalStaker
                        complete={complete}
                        totalStakedValue={totalStakedValue}
                        price={price}
                        isOver={isOver}
                        threshold={threshold}
                        belowThreshold={belowThreshold}
                        openForWithdraw={openForWithdraw}
                      />
                    </div>
                  </div>
                </Card>
                {showExecute && (
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                    <div style={{ padding: 8 }}>
                      <Button
                        size="large"
                        loading={pendingUnlock}
                        style={{ width: 180 }}
                        type="primary"
                        onClick={() => {
                          setPendingUnlock(true);
                          tx(writeContracts.Staker.execute(), update => {
                            if (update && update.error) {
                              setPendingUnlock(false);
                            }
                            if (update && (update.status === "confirmed" || update.status === 1)) {
                              setPendingUnlock(false);
                              forceUpdate();
                            }
                          });
                        }}
                      >
                        {executeText} {executeIcon}
                      </Button>
                    </div>
                  </div>
                )}
                {
                  // USER
                }
                <Card
                  style={{
                    width: "35rem",
                    margin: "2rem auto",
                    background: "linear-gradient(-45deg, #40A9FF0c, transparent)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: showWithdrawAction || showStakeAction ? "space-between" : "center",
                      alignItems: "center",
                    }}
                  >
                    {(showWithdrawAction || showStakeAction) && (
                      <div
                        style={{
                          minWidth: "10rem",
                          flex: "1 1 auto",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: "1rem",
                        }}
                      >
                        {showWithdrawAction && (
                          <>
                            <AddressInput
                              autoFocus
                              ensProvider={mainnetProvider}
                              placeholder="Enter address"
                              value={withdrawAddress}
                              onChange={setWithdrawAddress}
                            />
                            <Button
                              size="large"
                              style={{ minWidth: "10rem" }}
                              loading={pendingWithdrawal}
                              disabled={withdrawableAmountZero || withdrawableBalanceError}
                              type={"default"}
                              onClick={() => {
                                setPendingWithdrawal(true);
                                tx(writeContracts.Staker.withdraw(withdrawAddress), update => {
                                  if (update && update.error) {
                                    setPendingWithdrawal(false);
                                  }
                                  if (update && (update.status === "confirmed" || update.status === 1)) {
                                    setPendingWithdrawal(false);
                                    forceUpdate();
                                  }
                                });
                              }}
                            >
                              Withdraw <RollbackOutlined />
                            </Button>
                          </>
                        )}
                        {showStakeAction && (
                          <AddStake
                            tx={tx}
                            writeContracts={writeContracts}
                            price={price}
                            forceUpdate={forceUpdate}
                            userBalanceZero={userBalanceZero}
                          />
                        )}
                      </div>
                    )}

                    <Card style={{ padding: 8, width: "15rem", color: primaryCol, flexShrink: 0 }}>
                      <div style={{ fontSize: "1.25rem", color: particularBalanceColor }}>{particularBalanceTitle}</div>
                      {withdrawableBalanceError && <span style={{ fontSize: "1.5rem" }}>...</span>}
                      {!withdrawableBalanceError && (
                        <Balance etherMode balance={particularBalanceAmount} fontSize={64} price={price} />
                      )}
                    </Card>
                  </div>
                </Card>
                <div style={{ width: 500, margin: "auto", marginTop: 64 }}>
                  <div style={{ color: softTextCol, fontSize: "1rem" }}>Stake Events</div>
                  <List
                    dataSource={stakeEvents}
                    renderItem={item => {
                      return (
                        <List.Item key={item.blockNumber}>
                          <Address value={item.args[0]} ensProvider={mainnetProvider} fontSize={16} /> {"=>"}
                          <Balance etherMode balance={item.args[1]} />
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </Route>
        <Route exact path="/debug">
          <div style={{ paddingBottom: "6rem" }}>
            <Contract
              name="Staker"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
            <Contract
              name="ExampleExternalContract"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </div>
        </Route>
      </Switch>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div
        style={{
          position: "fixed",
          textAlign: "right",
          right: 0,
          top: 0,
          padding: 10,
          backgroundColor: "hsla(209deg, 100%, 55%, 0.1)",
          backdropFilter: "blur(2px)",
          borderBottom: "1px solid #e3e3e3",
          borderLeft: "1px solid #e3e3e3",
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ marginRight: 20 }}>
            <NetworkSwitch
              networkOptions={networkOptions}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
            />
          </div>
          <Account
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </div>
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div
        style={{
          position: "fixed",
          textAlign: "left",
          left: 0,
          bottom: 20,
          padding: 10,
          backgroundColor: "hsla(209deg, 100%, 55%, 0.1)",
          backdropFilter: "blur(2px)",
          borderTop: "1px solid #e3e3e3",
          borderRight: "1px solid #e3e3e3",
          borderBottom: "1px solid #e3e3e3",
        }}
      >
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
