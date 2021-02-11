'use strict';

const db = require('../db');
const DataTypes = db.Sequelize;

const Artist = db.define('artist', {

  name: {
    type: DataTypes.STRING(1e4), // eslint-disable-line new-cap
    allowNull: false,
    set: function (val) {
      this.setDataValue('name', val.trim());
    }
  }

});

Artist.prototype.getAlbums = function () {
  return db.model('album').findAll({
    where : {artistId : this.id},
    include: [{
      model: db.model('song'),
      include: [{
        model: db.model('artist'),
        where: { id: this.id } // makes this entire query an inner join
      }]
    }]
  });
}

Artist.prototype.toJSON = function () {
  //Return a shallow clone so toJSON method of the nested models can be called recursively.
  return Object.assign({}, this.get());
}

module.exports = Artist;
