const Org = require('../models/Org');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listOrgs = asyncHandler(async (req, res) => {
  const orgs = await Org.find({}).sort('name');
  sendSuccess(res, orgs);
});

const createOrg = asyncHandler(async (req, res) => {
  const org = new Org(req.body);
  await org.save();
  sendSuccess(res, org, 'Organization created successfully', 201);
});

module.exports = { listOrgs, createOrg };
