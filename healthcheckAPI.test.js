var supertest = require("supertest");
//var should = require("should");
var assert = require('assert');
var server = supertest.agent("http://127.0.0.1:3000");

describe("webapp-test", function () {
    it('Simple assert test', function () {
        assert.equal(1, 1);
    });
    // it("should return 200 OK", function (done) {

    //     server
    //         .get("/healthz")
    //         .expect(200)
    //         .end((err, response) => {
    //             if (err) {
    //                 return done(err);
    //             }
    //             else {
    //                 return done();
    //             }
    //         });
    // });
});
// describe('webapp-test', function () {


//     it('GET /healthz end point of the application', (done) => {
//         supertest(healthcheckRouter)
//             .get('/healthz')
//             .expect(200)
//             .end((err, response) => {
//                 if (err) {
//                     return done(err);
//                 }
//                 else {
//                     return done();
//                 }
//             })
//     })
// });
