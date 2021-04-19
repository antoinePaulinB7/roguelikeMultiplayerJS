const { Glyph } = require('./glyph')

class GameObject extends Glyph {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._name = properties['name'] || ''

    this._attachedMixins = {}
    this._attachedMixinGroups = {}

    let mixins = properties['mixins'] || []

    for (let mixin of mixins) {
      for (let key in mixin) {
        if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
          this[key] = mixin[key]
        }
      }

      this._attachedMixins[mixin.name] = true

      if (mixin.groupName) {
        this._attachedMixinGroups[mixin.groupName] = true
      }

      if (mixin.init) {
        mixin.init.call(this, properties)
      }
    }
  }

  setName = (name) => (this._name = name)
  getName = () => this._name

  describe = () => this._name
  describeA = (capitalize) => {
    let prefixes = capitalize ? ['A', 'An'] : ['a', 'an']
    let string = this.describe()

    let firstLetter = string.charAt(0).toLowerCase()
    let prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0

    return `${prefixes[prefix]} ${string}`
  }

  hasMixin = (mixin) => {
    if (typeof mixin === 'object') {
      return this._attachedMixins[mixin.name]
    } else {
      return this._attachedMixins[mixin] || this._attachedMixinGroups[mixin]
    }
  }
}

module.exports = {
  GameObject,
}
