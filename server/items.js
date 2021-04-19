class ItemMixins {}

ItemMixins.Edible = {
  name: 'Edible',
  init: function (template) {
    this._foodValue = template['foodValue'] || 5
    this._maxConsumptions = template['maxConsumptions'] || 1
    this._remainingConsumptions =
      template['remainingConsumptions'] || this._maxConsumptions
  },
  eat: function (entity) {
    if (entity.hasMixin('FoodConsumer')) {
      if (this.hasRemainingConsumptions()) {
        entity.modifyFullnessBy(this._foodValue)
        this._remainingConsumptions--
      }
    }
  },
  hasRemainingConsumptions: function () {
    return this._remainingConsumptions > 0
  },
  describe: function () {
    if (this._maxConsumptions != this._remainingConsumptions) {
      return `partially eaten ${this.getName()}`
    } else {
      return this.getName()
    }
  },
}

class Items {}

module.exports = {
  ItemMixins,
  Items,
}
