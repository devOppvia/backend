const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const locationServices = require("../../services/Locations/location.service");

exports.getCountries = async (req, res) => {
  try {
    let response = await locationServices.getCountries();
    return successResponse(
      res,
      response,
      "Countries fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getStatesByCountry = async (req, res) => {
  try {
    let response = await locationServices.getStatesByCountry("IN");
    return successResponse(
      res,
      response,
      "States fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCitiesByState = async (req, res) => {
  try {
    let { stateCode } = req.params || {};
    if (!stateCode) {
      return errorResponse(res, "State code is required", 400);
    }

    let response = await locationServices.getCitiesByState("IN", stateCode);
    return successResponse(
      res,
      response,
      "Cities fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getPreferredCities = async (req, res) => {
  try {
    let { state } = req.body || {};
    if (!state) {
      return errorResponse(res, "State code is required", 400);
    }
    const stateIds = state.map((item) => item.id || item?.tag);
    // const stateIds = state
    let response = await locationServices.getPreferredLocation("IN", stateIds);
    return successResponse(
      res,
      response,
      "Preferred locations fetched successfully",
      {},
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Internal server error", 500);
  }
};
