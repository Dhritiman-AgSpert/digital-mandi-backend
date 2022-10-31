const { authJwt } = require("../middlewares");
const controller = require("../controllers/mandi.controller");
const { verifySignUp } = require("../middlewares");

module.exports = function(app) {
    app.use(function(req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
  
    app.get("/mandi/status", [authJwt.verifyToken, authJwt.isAdmin], controller.status);

    app.post("/mandi/toggle", [authJwt.verifyToken, authJwt.isAdmin], controller.toggle);
    
}