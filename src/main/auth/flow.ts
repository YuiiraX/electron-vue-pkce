/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


import { EventEmitter } from 'events'
import {
  AuthorizationNotifier,
  AuthorizationRequest,
  AuthorizationRequestHandler,
  AuthorizationServiceConfiguration,
  BaseTokenRequestHandler,
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
  StringMap,
  TokenRequest,
  TokenRequestHandler,
  TokenResponse
} from '@openid/appauth'
import { NodeBasedHandler, NodeCrypto, NodeRequestor } from '@openid/appauth/built/node_support'
import { ElectronRequestHandler } from './request-handler'

import { log } from '../logger'
import Main from '../main'

export class AuthStateEmitter extends EventEmitter {
  static ON_TOKEN_RESPONSE = 'on_token_response'
}

export interface ClientConfig {
  openIdConnectUrl: string
  clientId: string
  redirectUri: string
  scope: string
}

export class AuthFlow {
  private readonly requestor: NodeRequestor
  private readonly notifier: AuthorizationNotifier

  private clientConfig: ClientConfig
  private tokenHandler: TokenRequestHandler
  private authorizationHandler: AuthorizationRequestHandler

  // state
  private configuration: AuthorizationServiceConfiguration | undefined

  private refreshToken: string | undefined
  private accessTokenResponse: TokenResponse | undefined

  readonly authStateEmitter: AuthStateEmitter

  constructor() {
    // define client config
    this.clientConfig = {
      openIdConnectUrl: 'https://demo.identityserver.io/',
      clientId: 'interactive.public',
      redirectUri: 'http://localhost:8000',
      scope: 'openid profile email offline_access'
    }

    this.requestor = new NodeRequestor()
    this.notifier = new AuthorizationNotifier()
    this.authStateEmitter = new AuthStateEmitter()


    this.authorizationHandler = new ElectronRequestHandler()
    this.tokenHandler = new BaseTokenRequestHandler(this.requestor)
    // set notifier to deliver responses
    this.authorizationHandler.setAuthorizationNotifier(this.notifier)
    // set a listener to listen for authorization responses
    // make refresh and access token requests.
    this.notifier.setAuthorizationListener((request, response, error) => {
      log('Authorization request complete ', request, response, error)
      if (response) {
        let codeVerifier: string | undefined
        if (request.internal && request.internal.code_verifier) {
          codeVerifier = request.internal.code_verifier
        }

        this.makeRefreshTokenRequest(response.code, codeVerifier)
          .then(result => this.performWithFreshTokens())
          .then(() => {
            Main.loadURL('app://./index.html')
            this.authStateEmitter.emit(AuthStateEmitter.ON_TOKEN_RESPONSE)
            log('All Done.')
          })
      }
    })
  }

  fetchServiceConfiguration(): Promise<void> {
    return AuthorizationServiceConfiguration.fetchFromIssuer(
      this.clientConfig.openIdConnectUrl,
      this.requestor
    ).then(response => {
      log('Fetched service configuration', response)
      this.configuration = response
    })
  }

  makeAuthorizationRequest(username?: string) {
    if (!this.configuration) {
      log('Unknown service configuration')
      return
    }

    const extras: StringMap = { prompt: 'consent', access_type: 'offline' }

    if (username) {
      extras['login_hint'] = username
    }

    // create a request
    const request = new AuthorizationRequest(
      {
        client_id: this.clientConfig.clientId,
        redirect_uri: this.clientConfig.redirectUri,
        scope: this.clientConfig.scope,
        response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
        state: undefined,
        extras: extras
      },
      new NodeCrypto()
    )

    log('Making authorization request ', this.configuration, request)

    this.authorizationHandler.performAuthorizationRequest(
      this.configuration,
      request
    )
  }

  isLoggedIn(): boolean {
    return !!this.accessTokenResponse && this.accessTokenResponse.isValid()
  }

  signOut() {
    // forget all cached token state
    this.accessTokenResponse = undefined
  }

  performWithFreshTokens(): Promise<string> {
    if (!this.configuration) {
      log('Unknown service configuration')
      return Promise.reject('Unknown service configuration')
    }
    if (!this.refreshToken) {
      log('Missing refreshToken.')
      return Promise.resolve('Missing refreshToken.')
    }
    if (this.accessTokenResponse && this.accessTokenResponse.isValid()) {
      // do nothing
      return Promise.resolve(this.accessTokenResponse.accessToken)
    }
    let request = new TokenRequest({
      client_id: this.clientConfig.clientId,
      redirect_uri: this.clientConfig.redirectUri,
      grant_type: GRANT_TYPE_REFRESH_TOKEN,
      code: undefined,
      refresh_token: this.refreshToken,
      extras: undefined
    })

    return this.tokenHandler
      .performTokenRequest(this.configuration, request)
      .then(response => {
        this.accessTokenResponse = response
        return response.accessToken
      })
  }

  private makeRefreshTokenRequest(
    code: string,
    codeVerifier: string | undefined
  ): Promise<void> {
    if (!this.configuration) {
      log('Unknown service configuration')
      return Promise.resolve()
    }

    const extras: StringMap = {}

    if (codeVerifier) {
      extras.code_verifier = codeVerifier
    }

    // use the code to make the token request.
    let request = new TokenRequest({
      client_id: this.clientConfig.clientId,
      redirect_uri: this.clientConfig.redirectUri,
      grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
      code: code,
      refresh_token: undefined,
      extras: extras
    })

    return this.tokenHandler
      .performTokenRequest(this.configuration, request)
      .then(response => {
        log(`Refresh Token is ${response.refreshToken}`)
        this.refreshToken = response.refreshToken
        this.accessTokenResponse = response
        return response
      })
      .then(() => {})
  }
}
