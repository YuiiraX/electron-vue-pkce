declare const __static: string;

import Http from 'http'
import Url from 'url'
import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'

import {
  AuthorizationRequest,
  AuthorizationRequestHandler,
  AuthorizationRequestResponse,
  AuthorizationServiceConfiguration,
  BasicQueryStringUtils,
  QueryStringUtils,
  AuthorizationError,
  AuthorizationResponse,
  Crypto
} from '@openid/appauth'

import { NodeCrypto } from '@openid/appauth/src/node_support'

import { log } from '../logger'
import Main from '../main'

class ServerEventsEmitter extends EventEmitter {
  static ON_UNABLE_TO_START = 'unable_to_start'
  static ON_AUTHORIZATION_RESPONSE = 'authorization_response'
}

export class ElectronRequestHandler extends AuthorizationRequestHandler {
  // the handle to the current authorization request
  authorizationPromise: Promise<AuthorizationRequestResponse | null> | null = null

  constructor(
    // default to port 8000
    public httpServerPort = 8000,
    utils: QueryStringUtils = new BasicQueryStringUtils(),
    crypto: Crypto = new NodeCrypto()
  ) {
    super(utils, crypto)
  }

  performAuthorizationRequest(
    configuration: AuthorizationServiceConfiguration,
    request: AuthorizationRequest
  ): void {
    // use opener to launch a web browser and start the authorization flow.
    // start a web server to handle the authorization response.
    const emitter = new ServerEventsEmitter()

    const requestHandler = (
      httpRequest: Http.IncomingMessage,
      response: Http.ServerResponse
    ) => {
      if (!httpRequest.url) {
        return
      }

      const url = Url.parse(httpRequest.url)
      const searchParams = new Url.URLSearchParams(url.query || '')

      const state = searchParams.get('state') || undefined
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (!state && !code && !error) {
        // ignore irrelevant requests (e.g. favicon.ico)
        return
      }

      log('Handling Authorization Request ', searchParams, state, code, error)
      let authorizationResponse: AuthorizationResponse | null = null
      let authorizationError: AuthorizationError | null = null
      if (error) {
        log('error')
        // get additional optional info.
        const errorUri = searchParams.get('error_uri') || undefined
        const errorDescription =
          searchParams.get('error_description') || undefined
        authorizationError = new AuthorizationError({
          error: error,
          error_description: errorDescription,
          error_uri: errorUri,
          state: state
        })
      } else {
        authorizationResponse = new AuthorizationResponse({
          code: code!,
          state: state!
        })
      }
      const completeResponse = {
        request,
        response: authorizationResponse,
        error: authorizationError
      } as AuthorizationRequestResponse

      emitter.emit(
        ServerEventsEmitter.ON_AUTHORIZATION_RESPONSE,
        completeResponse
      )

      fs.readFile(path.join(__static, '/redirect.html'), function(
        err,
        html
      ) {
        if (err) {
          throw err
        }
        response.writeHead(200, {
          'Content-Type': 'text/html',
          'Content-Length': html.length
        })
        response.write(html)
        response.end()
      })
    }

    this.authorizationPromise = new Promise<AuthorizationRequestResponse>(
      (resolve, reject) => {
        emitter.once(ServerEventsEmitter.ON_UNABLE_TO_START, () => {
          reject(`Unable to create HTTP server at port ${this.httpServerPort}`)
        })
        emitter.once(
          ServerEventsEmitter.ON_AUTHORIZATION_RESPONSE,
          (result: any) => {
            server.close()
            // resolve pending promise
            resolve(result as AuthorizationRequestResponse)
            // complete authorization flow
            this.completeAuthorizationRequestIfPossible()
          }
        )
      }
    )

    let server: Http.Server
    request
      .setupCodeVerifier()
      .then(() => {
        server = Http.createServer(requestHandler)
        server.listen(this.httpServerPort)
        const url = this.buildRequestUrl(configuration, request)
        log('Making a request to ', request, url)
        Main.loadURL(url)
      })
      .catch(error => {
        log('Something bad happened ', error)
        emitter.emit(ServerEventsEmitter.ON_UNABLE_TO_START)
      })
  }

  protected completeAuthorizationRequest(): Promise<AuthorizationRequestResponse | null> {
    if (!this.authorizationPromise) {
      return Promise.reject(
        'No pending authorization request. Call performAuthorizationRequest() ?'
      )
    }
    return this.authorizationPromise
  }
}
