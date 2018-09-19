'use strict';

var constants = require('intervaluecore/constants.js');

angular.module('copayApp.services').factory('txFormatService', function (profileService, configService, lodash) {
  var root = {};

  var formatAmountStr = function (amount, asset) {
    if (!amount) return;
    if (asset !== "base" && asset !== constants.BLACKBYTES_ASSET && !profileService.assetMetadata[asset])
      return amount;
    return profileService.formatAmountWithUnit(amount, asset);
  };

  var formatAmount = function (amount, asset) {
      return profileService.formatAmountUnit(amount, asset);
  };

  var formatFeeStr = function (fee) {
    if (!fee) return;
    return fee + ' bytes';
  };

  root.processTx = function (tx) {
    if (!tx) return;
    //console.log(JSON.stringify(tx));
    var outputs = tx.outputs ? tx.outputs.length : 0;
    if (outputs > 1 && tx.action != 'received') {
      tx.hasMultiplesOutputs = true;
      tx.recipientCount = outputs;
      tx.amount = lodash.reduce(tx.outputs, function (total, o) {
        o.amountStr = formatAmountStr(o.amount, tx.asset);
        return total + o.amount;
      }, 0);
    }
    tx.my_address = tx.addressFrom;
    tx.asset = 'base';
    tx.confirmations = tx.result;
    tx.time = tx.creation_date;
    tx.amountStr = formatAmountStr(tx.amount, tx.asset);
    tx.amountTl = formatAmount(tx.amount, tx.asset);//
    tx.feeStr = formatFeeStr(tx.fee || tx.fees);
    tx.addressFrom = tx.addressFrom;
    return tx;
  };

  return root;
});
