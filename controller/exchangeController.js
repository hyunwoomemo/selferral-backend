const { default: axios } = require("axios");
const exchangeModel = require("../model/exchangeModel");
require("dotenv").config();

exports.getAll = async (req, res) => {
  console.log("req", req);

  const exchanges = await exchangeModel.getAllExchanges();

  res.status(200).json({ data: exchanges });
};

exports.test = async (req, res) => {
  console.log("req res", req, res);

  res.status(200).json("test");
};
