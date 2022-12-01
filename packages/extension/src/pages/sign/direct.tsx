import { Currency } from '@owallet/types';
import { IntlShape } from 'react-intl';
import { cosmos, cosmwasm, UnknownMessage } from '@owallet/cosmos';
import {
  renderMsgBeginRedelegate,
  renderMsgDelegate,
  renderMsgExecuteContract,
  renderMsgSend,
  renderMsgUndelegate,
  renderMsgWithdrawDelegatorReward,
  renderUnknownMessage
} from './messages';
import { CoinPrimitive } from '@owallet/stores';

import { Buffer } from 'buffer';
import { fromUtf8 } from '@cosmjs/encoding';

export function renderDirectMessage(
  msg: any,
  currencies: Currency[],
  intl: IntlShape
) {
  try {
    if (msg instanceof cosmos.bank.v1beta1.MsgSend) {
      return renderMsgSend(
        currencies,
        intl,
        msg.amount as CoinPrimitive[],
        msg.toAddress
      );
    }

    if (msg instanceof cosmos.staking.v1beta1.MsgDelegate) {
      return renderMsgDelegate(
        currencies,
        intl,
        msg.amount as CoinPrimitive,
        msg.validatorAddress
      );
    }

    if (msg instanceof cosmos.staking.v1beta1.MsgBeginRedelegate) {
      return renderMsgBeginRedelegate(
        currencies,
        intl,
        msg.amount as CoinPrimitive,
        msg.validatorSrcAddress,
        msg.validatorDstAddress
      );
    }

    if (msg instanceof cosmos.staking.v1beta1.MsgUndelegate) {
      return renderMsgUndelegate(
        currencies,
        intl,
        msg.amount as CoinPrimitive,
        msg.validatorAddress
      );
    }
    if(msg instanceof cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward){
      return renderMsgWithdrawDelegatorReward(intl,msg.validatorAddress);
    }
    if (
      msg instanceof cosmwasm.wasm.v1.MsgExecuteContract 
    ) {
      return renderMsgExecuteContract(
        currencies,
        intl,
         msg.funds as CoinPrimitive[],
        undefined,
        msg.contract,
        JSON.parse(fromUtf8(msg.msg))
      );
    }

    if (msg instanceof UnknownMessage) {
      return renderUnknownMessage(msg.toJSON());
    }
  } catch (e) {
    console.log(e);
  }

  return renderUnknownMessage({
    typeUrl: msg.typeUrl || msg.type_url || 'Unknown',
    value: Buffer.from(msg.value).toString('base64')
  });
}
