const { Glyph } = require('./glyph')

class Item extends Glyph {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._name = properties['name'] || ''
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
}

module.exports = {
  Item,
}
