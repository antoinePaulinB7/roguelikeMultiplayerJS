const { randomize } = require('./utils')

class Repository {
  constructor(name, ctor) {
    this._name = name
    this._templates = {}
    this._ctor = ctor
  }

  define = (name, template) => {
    this._templates[name] = template
  }

  create = (name) => {
    let template = this._templates[name]

    if (!template) {
      throw new Error(`No template named ${name} in repository ${this._name}`)
    }

    return new this._ctor(template)
  }

  createRandom = () => {
    let keys = Object.keys(this._templates)

    return this.create(keys[Math.floor(Math.random() * keys.length)])
  }
}

module.exports = {
  Repository,
}
