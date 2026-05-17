// SPDX-License-Identifier: MIT
import { Router } from "express";
import {
  buildHttpHandler,
  parseAuthTokenFromRequest,
  optionsHandler
} from "./utils.js";
import { isNonNullObject } from "../util.js";
import { InvalidArgumentError } from "../errors/http.js";

function getItemsFromRequest(req) {
  const { body } = req;
  let items;
  if (body.item) {
    items = [].concat(body.item);
  } else if (body.id) {
    items = [].concat(body);
  } else {
    items = [].concat(body);
  }
  if (!(Array.isArray(items) && items.every(item => isNonNullObject(item)))) {
    throw new InvalidArgumentError("item must be a non-null object");
  }
  return items;
}

// TODO Wire up auth.
const buildPostCompileHandler = ({ compile }) => {
  return buildHttpHandler(async (req, res) => {
    const auth = ""; //req.auth.context;
    const authToken = parseAuthTokenFromRequest(req);
    try {
      const data = await compile({ auth, authToken, lang: "0173", ...req.body });
      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json(data);
    } catch (error) {
      if (error.message === 'Missing required parameters: code and data') {
        res.status(400).json({ error: error.message });
      } else {
        throw error;
      }
    }
  });
};

export default ({ compile }) => {
  const router = new Router();
  router.post("/", buildPostCompileHandler({ compile }));
  router.options("/", optionsHandler);
  return router;
};
