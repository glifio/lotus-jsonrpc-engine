/* eslint-env mocha */
const { expect } = require('chai')
const nock = require('nock')
const LotusRpcEngine = require('../').default
const { removeEmptyHeaders, throwIfErrors } = require('../')
const expectThrowsAsync = require('./expectThrowsAsync')

const successfulResponse = {
  jsonrpc: '2.0',
  result: 'fake response result',
  id: 1,
}

const errorResponse = {
  jsonrpc: '2.0',
  result: '\u003cnil\u003e',
  id: 1,
  error: {
    code: 1,
    message: 'get actor: GetActor called on undefined address',
  },
}

describe('removeEmptyHeaders', () => {
  it('should return an object without keys that are set to falsey values', () => {
    const headers = {
      'Content-Type': 'text/plain;charset=UTF-8',
      Test: 'value',
      Accept: undefined,
      Authorization: null,
    }

    expect(removeEmptyHeaders(headers)).to.eql({
      'Content-Type': 'text/plain;charset=UTF-8',
      Test: 'value',
    })
  })
})

describe('throwIfErrors', () => {
  it('returns responses with no errors', () => {
    expect(throwIfErrors(successfulResponse)).to.eql(successfulResponse)
  })

  it('throws a descriptive error if the jsonrpc response comes back with an error', () => {
    expect(() => throwIfErrors(errorResponse)).to.throw(
      errorResponse.error.message,
    )
  })
})

describe('LotusRpcEngine', () => {
  it('throws an error if no apiAddress is passed to constructor', () => {
    const instantiateLotusRpcEngine = () => new LotusRpcEngine()
    expect(instantiateLotusRpcEngine).to.throw()
  })
  describe('request', () => {
    const lotus = new LotusRpcEngine({
      apiAddress: 'http://127.0.0.1:1234/rpc/v0',
    })

    it('passes the first argument as the jsonrpc method', done => {
      const method = 'ChainHead'
      nock('http://127.0.0.1:1234')
        .post('/rpc/v0')
        .reply(201, (uri, requestBody) => {
          const body = JSON.parse(requestBody)
          expect(body.method).to.eql(`Filecoin.${method}`)
          done()
        })

      lotus.request(method)
    })

    it('passes the subsequent arguments as the jsonrpc params', done => {
      const method = 'FakeJsonRpcMethodWithMultipleParams'
      const param1 = 't1mbk7q6gm4rjlndfqw6f2vkfgqotres3fgicb2uq'
      const param2 = 'RIP Kobe.'
      nock('http://127.0.0.1:1234')
        .post('/rpc/v0')
        .reply(201, (uri, requestBody) => {
          const body = JSON.parse(requestBody)
          expect(body.params).to.eql([param1, param2])
          done()
        })

      lotus.request(method, param1, param2)
    })

    it('returns the result when response is successful', async () => {
      const method = 'FakeMethod'
      nock('http://127.0.0.1:1234')
        .post('/rpc/v0')
        .reply(201, () => successfulResponse)

      const response = await lotus.request(method)
      expect(response).to.eql(successfulResponse.result)
    })

    it('throws an error with the error message when response is unsuccessful', async () => {
      const method = 'FakeMethod'
      nock('http://127.0.0.1:1234')
        .post('/rpc/v0')
        .reply(201, () => errorResponse)

      await expectThrowsAsync(
        () => lotus.request(method),
        errorResponse.error.message,
      )
    })
  })
})
