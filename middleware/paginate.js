function paginatedResults(model) {
  return async (req, res, next) => {
    const results = {};
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const startIdx = (page - 1) * limit;
    const endIdx = page * limit;
    results.total = await model.count();

    if (endIdx < results.total) {
      results.next = {
        page: page + 1,
        limit,
      };
    }
    if (startIdx > 0) {
      results.prev = {
        page: page - 1,
        limit,
      };
    }

    try {
      results.results = await model.find().limit(limit).skip(startIdx).exec();
      res.paginatedResults = results;

      next();
    } catch (e) {
      res.status(500).jsos({ message: e.message });
    }
  };
}

module.exports = {
  paginatedResults,
};
