function ok(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function created(res, data, message = "Created") {
  return ok(res, data, message, 201);
}

function paginated(res, data, pagination, message = "OK") {
  return res.json({ success: true, message, data, pagination });
}

module.exports = { ok, created, paginated };
