import { ChainStore } from "./chain";
import { EmbedChainInfos, FiatCurrencies } from "../config";
import {
  KeyRingStore,
  InteractionStore,
  QueriesStore,
  CoinGeckoPriceStore,
  AccountStore,
  PermissionStore,
  SignInteractionStore,
  LedgerInitStore,
  TokensStore,
  ChainSuggestStore,
} from "@keplr-wallet/stores";
import { ExtensionKVStore } from "@keplr-wallet/common";
import {
  ExtensionRouter,
  ContentScriptEnv,
  ContentScriptGuards,
  InExtensionMessageRequester,
  APP_PORT,
} from "@keplr-wallet/router";
import { ChainInfoWithEmbed } from "@keplr-wallet/background";
import { FiatCurrency } from "@keplr-wallet/types";

export class RootStore {
  public readonly chainStore: ChainStore;
  public readonly keyRingStore: KeyRingStore;

  protected readonly interactionStore: InteractionStore;
  public readonly permissionStore: PermissionStore;
  public readonly signInteractionStore: SignInteractionStore;
  public readonly ledgerInitStore: LedgerInitStore;
  public readonly chainSuggestStore: ChainSuggestStore;

  public readonly queriesStore: QueriesStore;
  public readonly accountStore: AccountStore;
  public readonly priceStore: CoinGeckoPriceStore;
  public readonly tokensStore: TokensStore<ChainInfoWithEmbed>;

  constructor() {
    const router = new ExtensionRouter(ContentScriptEnv.produceEnv);
    router.addGuard(ContentScriptGuards.checkMessageIsInternal);

    // Order is important.
    this.interactionStore = new InteractionStore(
      router,
      new InExtensionMessageRequester()
    );

    this.chainStore = new ChainStore(
      EmbedChainInfos,
      new InExtensionMessageRequester()
    );

    this.keyRingStore = new KeyRingStore(
      this.chainStore,
      new InExtensionMessageRequester(),
      this.interactionStore
    );

    this.permissionStore = new PermissionStore(
      this.interactionStore,
      new InExtensionMessageRequester()
    );
    this.signInteractionStore = new SignInteractionStore(this.interactionStore);
    this.ledgerInitStore = new LedgerInitStore(
      this.interactionStore,
      new InExtensionMessageRequester()
    );
    this.chainSuggestStore = new ChainSuggestStore(this.interactionStore);

    this.queriesStore = new QueriesStore(
      new ExtensionKVStore("store_queries"),
      this.chainStore
    );

    this.accountStore = new AccountStore(this.chainStore, this.queriesStore, {
      defaultOpts: {
        // When the unlock request sent from external webpage,
        // it will open the extension popup below the uri "/unlock".
        // But, in this case, if the prefetching option is true, it will redirect
        // the page to the "/unlock" with **interactionInternal=true**
        // because prefetching will request the unlock from the internal.
        // To prevent this problem, just check the first uri is "#/unlcok" and
        // if it is "#/unlock", don't use the prefetching option.
        prefetching: !window.location.href.includes("#/unlock"),
      },
      chainOpts: this.chainStore.chainInfos.map((chainInfo) => {
        return { chainId: chainInfo.chainId };
      }),
    });

    this.priceStore = new CoinGeckoPriceStore(
      new ExtensionKVStore("store_prices"),
      FiatCurrencies.reduce<{
        [vsCurrency: string]: FiatCurrency;
      }>((obj, fiat) => {
        obj[fiat.currency] = fiat;
        return obj;
      }, {})
    );

    this.tokensStore = new TokensStore(
      this.chainStore,
      new InExtensionMessageRequester(),
      this.interactionStore
    );

    router.listen(APP_PORT);
  }
}

export function createRootStore() {
  return new RootStore();
}
