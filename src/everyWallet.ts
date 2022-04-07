/**
 * File: /src/everyWallet.ts
 * Project: every-wallet
 * File Created: 22-03-2022 11:29:28
 * Author: Clay Risser
 * -----
 * Last Modified: 07-04-2022 14:15:58
 * Modified By: Clay Risser
 * -----
 * Risser Labs LLC (c) Copyright 2022
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import WalletConnectProvider from "@walletconnect/web3-provider";
import { CoinbaseWalletSDKOptions } from "@coinbase/wallet-sdk/dist/CoinbaseWalletSDK";
import { IWalletConnectProviderOptions } from "@walletconnect/types/index";
import { ethers } from "ethers";
import CoinbaseWalletSDK, {
  CoinbaseWalletProvider,
} from "@coinbase/wallet-sdk";
import Errors from "./errors";
import coinbaseSvg from "./images/coinbase.svg";
import metamaskSvg from "./images/metamask.svg";
import modalCss from "./modal.css";
import modalHtml from "./modal.html";
import walletconnectSvg from "./images/walletconnect.svg";

export default class EveryWallet {
  public name: WalletProviderName;

  private options: WalletProviderOptions;

  private _walletConnectProvider: WalletConnectProvider | undefined;

  private _coinbaseProvider: CoinbaseWalletProvider | undefined;

  private _modalConnectedCallbacks: ((
    err?: Error,
    provider?: Provider
  ) => unknown)[] = [];

  private svgs = {
    "_every-wallet-coinbase-svg": coinbaseSvg,
    "_every-wallet-metamask-svg": metamaskSvg,
    "_every-wallet-walletconnect-svg": walletconnectSvg,
  };

  public connectedProvider: Provider | undefined;

  public ethers: typeof ethers = ethers;

  constructor(
    options: Partial<WalletProviderOptions> = {},
    name?: WalletProviderName | null
  ) {
    this.options = {
      ...options,
      alwaysPrompt: false,
      appName: "",
      coinbase: {},
      jsonRpcUrl: "",
      network: "mainnet",
      walletConnect: {},
      modal: !options.modal
        ? false
        : typeof options.modal === "string"
        ? options.modal
        : "_modal-id",
    };
    this.options.jsonRpcUrl = EveryWallet.getDefaultJsonRpcUrl(this.options);
    if (name) {
      this.name = name;
    } else {
      this.name = !window.ethereum?.isMetaMask
        ? WalletProviderName.MetaMask
        : WalletProviderName.WalletConnect;
    }
    if (this.options.modal) this.injectModal();
  }

  async connect(): Promise<Provider> {
    switch (this.name) {
      case WalletProviderName.Coinbase: {
        return this.connectCoinbase();
      }
      case WalletProviderName.MetaMask: {
        return this.connectMetaMask();
      }
    }
    return this.connectWalletConnect();
  }

  async connectCoinbase() {
    if (this.options.alwaysPrompt) {
      await this.coinbaseProvider.request({ method: "eth_requestAccounts" });
    } else {
      await this.coinbaseProvider.request({ method: "eth_requestAccounts" });
    }
    this.connectedProvider = new ethers.providers.Web3Provider(
      this.coinbaseProvider as any
    );
    return this.connectedProvider;
  }

  async connectMetaMask() {
    if (!window.ethereum?.isMetaMask) {
      window.open("https://metamask.io", "_blank");
      throw Errors.MetaMaskNotInstalled;
    }
    if (!window.ethereum.request) {
      throw Errors.WalletConnectionFailed;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    this.connectedProvider = new ethers.providers.Web3Provider(
      window.ethereum as any
    );
    return this.connectedProvider;
  }

  async connectWalletConnect() {
    await this.walletConnectProvider.enable();
    this.connectedProvider = new ethers.providers.Web3Provider(
      this.walletConnectProvider
    );
    return this.connectedProvider;
  }

  async connectWithModal(): Promise<Provider> {
    window._everyWalletInstance._modalConnectedCallbacks = [];
    window._everyWalletInstance.options = this.options;
    window._everyWalletInstance.openModal();
    return new Promise((resolve, reject) => {
      window._everyWalletInstance._modalConnectedCallbacks.push(
        (err?: Error, provider?: Provider) => {
          if (!err && !provider) err = Errors.WalletConnectionFailed;
          if (err) {
            window._everyWalletInstance.closeModal();
            return reject(err);
          }
          return resolve(provider as Provider);
        }
      );
    });
  }

  private injectModal() {
    if (window._everyWalletInstance) return;
    window._everyWalletInstance = this;
    const divElement = document.createElement("div");
    divElement.id = this.modalId;
    divElement.innerHTML = modalHtml;
    const styleElement = document.createElement("style");
    styleElement.innerHTML = modalCss;
    divElement.appendChild(styleElement);
    Object.entries(this.svgs).forEach(([id, svg]: [string, string]) => {
      const svgElement = divElement.querySelector(`#${id}`);
      if (svgElement) svgElement.innerHTML = svg;
    });
    document.body.appendChild(divElement);
    window.onclick = (event) => {
      if (event.target == this.modalElement) this.closeModal();
    };
    window._everyWalletConnectMetaMask = async () => {
      let error: Error | undefined;
      try {
        this.closeModal();
        await this.connectMetaMask();
      } catch (err) {
        error = err as Error;
      }
      if (!this.connectedProvider && !error) {
        error = Errors.WalletConnectionFailed;
      }
      this._modalConnectedCallbacks.forEach(
        (connectedCallback: (err?: Error, provider?: Provider) => unknown) => {
          connectedCallback(undefined, this.connectedProvider);
        }
      );
      if (error) throw error;
      return this.connectedProvider as Provider;
    };
    window._everyWalletConnectCoinbase = async () => {
      let error: Error | undefined;
      try {
        this.closeModal();
        await this.connectCoinbase();
      } catch (err) {
        error = err as Error;
      }
      if (!this.connectedProvider && !error) {
        error = Errors.WalletConnectionFailed;
      }
      this._modalConnectedCallbacks.forEach(
        (connectedCallback: (err?: Error, provider?: Provider) => unknown) => {
          connectedCallback(undefined, this.connectedProvider);
        }
      );
      if (error) throw error;
      return this.connectedProvider as Provider;
    };
    window._everyWalletConnectWalletConnect = async () => {
      let error: Error | undefined;
      try {
        this.closeModal();
        await this.connectWalletConnect();
      } catch (err) {
        error = err as Error;
      }
      if (!this.connectedProvider && !error) {
        error = Errors.WalletConnectionFailed;
      }
      this._modalConnectedCallbacks.forEach(
        (connectedCallback: (err?: Error, provider?: Provider) => unknown) => {
          connectedCallback(error, this.connectedProvider);
        }
      );
      if (error) throw error;
      return this.connectedProvider as Provider;
    };
  }

  private openModal() {
    this.modalElement.style.display = "block";
  }

  private closeModal() {
    this.modalElement.style.display = "none";
  }

  private get walletConnectProvider() {
    // NOTE: do not memoize because it will not reinitialize correctly
    // if (this._walletConnectProvider) return this._walletConnectProvider;
    this._walletConnectProvider = new WalletConnectProvider(
      EveryWallet.getWalletConnectProviderOptions(this.options)
    );
    return this._walletConnectProvider;
  }

  private get coinbaseProvider() {
    if (this._coinbaseProvider) return this._coinbaseProvider;
    this._coinbaseProvider = new CoinbaseWalletSDK({
      appName: this.options.appName,
      darkMode: false,
      ...this.options.coinbase,
    }).makeWeb3Provider(this.options.jsonRpcUrl, 1);
    return this._coinbaseProvider;
  }

  private static getWalletConnectProviderOptions(
    options: WalletProviderOptions
  ) {
    if (options.infuraId) {
      return {
        infuraId: options.infuraId,
        ...options.walletConnect,
      };
    }
    return {
      rpc: {
        0: options.jsonRpcUrl || options.jsonRpcUrl,
        ...(options.walletConnect.rpc || {}),
      },
      ...options.walletConnect,
    };
  }

  private get modalId() {
    return typeof this.options.modal === "string"
      ? this.options.modal
      : "_every-wallet";
  }

  private get modalElement() {
    const modalElement: HTMLDivElement | null = document.querySelector(
      `#${this.modalId} > ._every-wallet-modal`
    );
    if (!modalElement) throw Errors.ModalNotInjected;
    return modalElement;
  }

  private static getDefaultJsonRpcUrl(options: WalletProviderOptions) {
    if (options.infuraId) {
      return `https://${options.network}.infura.io/v3/${options.infuraId}`;
    }
    if (options.network === "mainnet") return "https://cloudflare-eth.com";
    throw Errors.InvalidJsonRpcUrl;
  }
}

export type Provider = ethers.providers.Web3Provider;

export enum WalletProviderName {
  Coinbase = "COINBASE",
  MetaMask = "META_MASK",
  WalletConnect = "WALLET_CONNECT",
}

export interface WalletProviderOptions {
  alwaysPrompt: boolean;
  appName: string;
  coinbase: Partial<CoinbaseWalletSDKOptions>;
  infuraId?: string;
  jsonRpcUrl: string;
  modal: boolean | string;
  network: Network;
  walletConnect: Partial<IWalletConnectProviderOptions>;
}

export type Network = "mainnet" | "ropsten" | "rinkeby" | "kovan";

declare global {
  interface Window {
    _everyWalletConnectCoinbase(): Promise<Provider>;
    _everyWalletConnectMetaMask(): Promise<Provider>;
    _everyWalletConnectWalletConnect(): Promise<Provider>;
    _everyWalletInstance: EveryWallet;
  }
}
