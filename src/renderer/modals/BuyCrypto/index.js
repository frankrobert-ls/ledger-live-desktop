// @flow
import invariant from "invariant";
import React, { useCallback, useState, useEffect } from "react";
import querystring from "querystring";
import { useDispatch, useSelector } from "react-redux";
import type { Account } from "@ledgerhq/live-common/lib/types";
import useTheme from "~/renderer/hooks/useTheme";
import { activeAccountsSelector } from "~/renderer/reducers/accounts";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import { closeModal } from "~/renderer/actions/modals";
import SelectAccount from "~/renderer/components/SelectAccount";
import Switch from "~/renderer/components/Switch";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";

const sandboxAddresses = {
  BTC: "mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy",
};

const Main = ({ account, sandbox }: { account: Account, sandbox: boolean }) => {
  const primaryColor = useTheme("colors.wallet");
  const fontColor = useTheme("colors.black");
  const url = sandbox ? "https://trade-ui.sandbox.coinify.com" : "https://trade-ui.coinify.com";
  const partnerId = sandbox ? 104 : 119;

  const cryptoCurrencies = account.currency.ticker;
  const address = sandbox ? sandboxAddresses[cryptoCurrencies] : account.freshAddress;

  invariant(!sandbox || address, "no support for this currency in sandbox");

  useEffect(() => {
    function onMessage(e) {
      if (e.origin !== url || !e.data) return;
      const { type, event, context } = e.data;
      if (type !== "event") return;
      switch (event) {
        case "trade.receive-account-changed":
          if (context.address === address) {
            console.log(
              "we should trigger on device the validation and " +
                "block the UI for user to check on device?",
            );
          }
          break;
      }
      // TODO no events at the moment, we need it to trigger on device...
      // ? maybe a device step need to happen before that Main too
    }

    window.addEventListener("message", onMessage, false);
    return () => window.removeEventListener("message", onMessage, false);
  }, [address, url]);

  return (
    <>
      <iframe
        style={{
          border: "none",
          width: "100%",
          height: 400,
        }}
        src={
          url +
          "?" +
          querystring.stringify({
            fontColor,
            primaryColor,
            partnerId,
            cryptoCurrencies,
            address,
          })
        }
        targetPage="buy"
        sandbox
        allow="camera"
      ></iframe>
    </>
  );
};

const Root = () => {
  const accounts = useSelector(activeAccountsSelector);
  // ^FIXME in reality we would have to filter only supported accounts
  const [account, setAccount] = useState(accounts[0]);
  const [sandbox, setSandbox] = useState(true);
  // ^FIXME in reality we would have no sandbox mode here (but maybe a env var)
  const [main, setMain] = useState(false);

  if (main && account) {
    return <Main account={account} sandbox={sandbox} />;
  }

  return (
    <Box flow={2}>
      {/* $FlowFixMe */}
      <SelectAccount accounts={accounts} value={account} onChange={setAccount} />
      <Box horizontal flow={2}>
        <Switch isChecked={sandbox} onChange={setSandbox} />
        <span>sandbox mode</span>
      </Box>
      <Box alignItems="flex-end">
        <Button primary onClick={() => setMain(true)}>
          Continue
        </Button>
      </Box>
    </Box>
  );
};

const BuyCrypto = () => {
  const dispatch = useDispatch();

  const onClose = useCallback(() => {
    dispatch(closeModal("MODAL_BUY_CRYPTO"));
  }, [dispatch]);

  return (
    <Modal name="MODAL_BUY_CRYPTO" preventBackdropClick centered>
      <ModalBody onClose={onClose} title="Buy crypto" render={() => <Root />} />
    </Modal>
  );
};

export default BuyCrypto;
