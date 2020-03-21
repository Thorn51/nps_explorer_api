process.env.TZ = "UTC";
process.env.JWT_SECRET = "TEST-JWT-SECRET";

require("dotenv").config();
const { expect } = require("chai");
const supertest = require("supertest");

global.expect = expect;
global.supertest = supertest;
