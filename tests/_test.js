/**
 * File: /tests/_test.js
 * Project: every-wallet
 * File Created: 22-03-2022 11:48:58
 * Author: Clay Risser
 * -----
 * Last Modified: 24-03-2022 08:58:25
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

var options = {
  infuraId: "",
  modal: true,
};
var WalletProvider = window.WalletProvider;
var walletProvider = new WalletProvider(options);

function connectWallet() {
  walletProvider
    .connectWithModal()
    .then((provider) => {
      console.log("provider", provider);
    })
    .catch(console.error);
}

window.connectWallet = connectWallet;
