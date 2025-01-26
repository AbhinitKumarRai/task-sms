module.exports = class ResponseDispatcher {
  constructor() {
    this.key = "responseDispatcher";
  }

  dispatch(res, { ok = false, data = {}, code, errors = [], message = "" }) {
    const statusCode = code || (ok ? 200 : 400);
    return res.status(statusCode).send({ ok, data, errors, message });
  }
};
