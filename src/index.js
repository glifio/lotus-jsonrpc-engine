import axios from 'axios'

const removeEmptyHeaders = headers => {
  const newHeaders = {}
  Object.keys(headers).forEach(key => {
    if (headers[key]) newHeaders[key] = headers[key]
  })
  return newHeaders
}

const throwIfErrors = response => {
  if (response.error) {
    if (response.error.message) throw new Error(response.error.message)
    else throw new Error('Unknown jsonrpc error')
  } else {
    return response
  }
}

class LotusRpcEngine {
  constructor({ apiAddress, token }) {
    this.apiAddress = apiAddress
    this.token = token
  }

  async request(method, ...params) {
    const { data } = await axios.post(
      this.apiAddress,
      {
        jsonrpc: '2.0',
        method: `Filecoin.${method}`,
        params: [...params],
        id: 1,
      },
      {
        headers: removeEmptyHeaders({
          'Content-Type': 'text/plain;charset=UTF-8',
          Accept: '*/*',
          Authorization: this.token ? `Bearer ${this.token}` : null,
        }),
      },
    )
    throwIfErrors(data)
    return data.result
  }
}

export default LotusRpcEngine
