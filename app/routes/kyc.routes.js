const { authJwt } = require("../middlewares");
const controller = require("../controllers/kyc.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/kyc/view", [authJwt.verifyToken], controller.view);

  app.post("/api/kyc/create", [authJwt.verifyToken], controller.create);

  app.get("/api/kyc/all", [authJwt.verifyToken, authJwt.isAdmin], controller.all);

  app.post("/api/kyc/verify", [authJwt.verifyToken, authJwt.isAdmin], controller.verify);

  app.post("/api/kyc/unverify", [authJwt.verifyToken, authJwt.isAdmin], controller.unverify);

  app.post("/api/kyc/set_pp_status", [authJwt.verifyToken, authJwt.isAdmin], controller.set_pp_status);

  app.post("/api/kyc/set_pan_status", [authJwt.verifyToken, authJwt.isAdmin], controller.set_pan_status);

  app.post("/api/kyc/set_adhr_status", [authJwt.verifyToken, authJwt.isAdmin], controller.set_adhr_status);

  app.post("/api/kyc/edit_pp", [authJwt.verifyToken], controller.edit_pp);

  app.post("/api/kyc/edit_pan_pic", [authJwt.verifyToken], controller.edit_pan_pic);

  app.post("/api/kyc/edit_pan_number", [authJwt.verifyToken], controller.edit_pan_number);

  app.post("/api/kyc/edit_adhr", [authJwt.verifyToken], controller.edit_adhr);

  app.post("/api/kyc/edit_adhr_number", [authJwt.verifyToken], controller.edit_adhr_number);

};
