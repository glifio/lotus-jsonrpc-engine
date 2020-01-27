/* eslint-env mocha */
const { expect } = require('chai')

module.exports = async (method, errorMessage) => {
  let error = null
  try {
    await method()
  } catch (err) {
    error = err
  }
  expect(error).to.be.an('Error')
  if (errorMessage) {
    expect(error.message).to.equal(errorMessage)
  }
}
