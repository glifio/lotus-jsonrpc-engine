/**
 * @jest-environment node
 */
const nock = require('nock')
const LotusRpcEngine = require('..').default
const { removeEmptyHeaders, throwIfErrors } = require('..')
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
  test('it should return an object without keys that are set to falsey values', () => {
    const headers = {
      'Content-Type': 'text/plain;charset=UTF-8',
      Test: 'value',
      Accept: undefined,
      Authorization: null,
    }

    expect(removeEmptyHeaders(headers).Accept).toBeUndefined()
    expect(removeEmptyHeaders(headers).Authorization).toBeUndefined()
    expect(removeEmptyHeaders(headers)['Content-Type']).toBeTruthy()
    expect(removeEmptyHeaders(headers).Test).toBeTruthy()
  })
})

describe('throwIfErrors', () => {
  test('it returns responses with no errors', () => {
    expect(throwIfErrors(successfulResponse)).toBe(successfulResponse)
  })

  test('it throws a descriptive error if the jsonrpc response comes back with an error', () => {
    expect(() => throwIfErrors(errorResponse)).toThrow(
      errorResponse.error.message,
    )
  })
})

describe('LotusRpcEngine', () => {
  test('it throws an error if no apiAddress is passed to constructor', () => {
    const instantiateLotusRpcEngine = () => new LotusRpcEngine()
    expect(instantiateLotusRpcEngine).toThrow()
  })

  describe('request', () => {
    const lotus = new LotusRpcEngine({
      apiAddress: 'https://proxy.openworklabs.com/rpc/v0',
    })

    test('it passes the first argument as the jsonrpc method', done => {
      const method = 'ChainHead'
      nock('https://proxy.openworklabs.com')
        .post('/rpc/v0')
        .reply(201, (uri, body) => {
          expect(body.method).toBe(`Filecoin.${method}`)
          done()
        })

      lotus.request(method)
    })

    test('passes the subsequent arguments as the jsonrpc params', done => {
      const method = 'FakeJsonRpcMethodWithMultipleParams'
      const param1 = 't1mbk7q6gm4rjlndfqw6f2vkfgqotres3fgicb2uq'
      const param2 = 'RIP Kobe.'
      nock('https://proxy.openworklabs.com')
        .post('/rpc/v0')
        .reply(201, (uri, body) => {
          expect(body.params[0]).toBe(param1)
          expect(body.params[1]).toBe(param2)
          done()
        })

      lotus.request(method, param1, param2)
    })

    test('returns the result when response is successful', async () => {
      const method = 'FakeMethod'
      nock('https://proxy.openworklabs.com')
        .post('/rpc/v0')
        .reply(201, () => {
          return successfulResponse
        })

      const response = await lotus.request(method)
      expect(response).toBe(successfulResponse.result)
    })

    test('throws an error with the error message when response is unsuccessful', async () => {
      const method = 'FakeMethod'
      nock('https://proxy.openworklabs.com')
        .post('/rpc/v0')
        .reply(201, () => errorResponse)

      await expectThrowsAsync(
        () => lotus.request(method),
        errorResponse.error.message,
      )
    })
  })
})
