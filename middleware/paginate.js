function paginatedResults(model, populateModel) {
  return async (req, res, next) => {
    const results = {};
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const type = req.query.type;

    const sortCriteria = {};

    if (type) {
      sortCriteria.createdAt = type === 'desc' ? -1 : 1;
      sortCriteria.likeCount = type === 'likeCount' ? 1 : -1;
    }

    const startIdx = (page - 1) * limit;
    const endIdx = page * limit;

    results.total = await model.count();
    results.pageCount = Math.ceil(results.total / limit);

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
      results.results = await model
        .find()
        .sort(sortCriteria)
        .populate(populateModel ? populateModel : '')
        .limit(limit)
        .skip(startIdx)
        .exec();

      res.paginatedResults = results;

      next();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  };
}

module.exports = {
  paginatedResults,
};
