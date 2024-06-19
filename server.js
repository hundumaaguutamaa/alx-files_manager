#!/usr/bin/node

const express = require("express");
const router = require("./routes/index");

// Create server object and set the path to specific port
const server = express();
const PORT = process.env.PORT ? process.env.PORT : 5000;

