const express = require("express");
const app = express();
const port = 3000;
var AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const path = require("path");

const jsonParser = bodyParser.json();

AWS_CONFIG = {
  aws_local_config: {
    region: "local",
    endpoint: "http://localhost:8000",
  },
  aws_remote_config: {
    accessKeyId: "AKIAJIYGZJZPXHVKY6DA",
    secretAccessKey: "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",
    region: "eu-west-1",
    correctClockSkew: true,
  },
};

const TABLE_SCHEMA = {
  TableName: "Movies",
  KeySchema: [
    { AttributeName: "year", KeyType: "HASH" }, //Partition key
    { AttributeName: "title", KeyType: "RANGE" }, //Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: "year", AttributeType: "N" },
    { AttributeName: "title", AttributeType: "S" },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
};

AWS.config.update(AWS_CONFIG.aws_remote_config);

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });


app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/../client/index.html"));
});

app.post("/api/createTable", async (req, res, next) => {
  dynamodb.createTable(TABLE_SCHEMA, function (err, data) {
    if (err) {
      const error = {
        errorMessage: "Unable to create table.",
        error: JSON.stringify(err, null, 2),
      };
      console.error(error);
      res.status(500).json(error);
      return;
    } else {
      console.log("Created table! Loading some data into it.");

      // Load values into our new database.
      for (const movie of moviedata) {
        console.log(movie);
        const params = {
          TableName: "Movies",
          Item: {
            year: movie.year,
            title: movie.title,
            info: movie.info,
          },
        };

        docClient.put(params, function (err, data) {
          if (err) {
            console.error(
              "Error occured when adding movie",
              movie.title,
              ". Error JSON:",
              JSON.stringify(err, null, 2)
            );
          }
        });
      }
      console.log("Created tables and added loaded movie items.");
      const response = {
        message: "Created table and added movie items.",
        data: {},
      };
      console.log(response);
      res.json(response);
    }
  });
});

app.post("/api/deleteTable", async (req, res, next) => {
  const params = {
    TableName: "Movies",
  };

  dynamodb.deleteTable(params, function (err, data) {
    if (err) {
      const error = {
        errorMessage: "Unable to delete table.",
        error: JSON.stringify(err, null, 2),
      };
      console.error(error);
      res.status(500).json(error);
      return;
    }
    const response = {
      message: "Deleted table.",
      data: JSON.stringify(err, null, 2),
    };
    console.log(response);
    res.json(response);
  });
});

app.post("/api/movies", jsonParser, async (req, res, next) => {
  const year = req.body["year"];
  const title = req.body["title"];

  console.log(
    `Querying for movies from ${year} - titles beggining with ${title}`
  );

  const params = {
    TableName: "Movies",
    ProjectionExpression: "#yr, title, info.genres, info.actors[0]",
    KeyConditionExpression:
      "#yr = :yyyy and begins_with(#titleName, :titleSearch)",
    ExpressionAttributeNames: {
      "#yr": "year",
      "#titleName": "title",
    },
    ExpressionAttributeValues: {
      ":yyyy": year,
      ":titleSearch": title,
    },
  };

  docClient.query(params, function (err, data) {
    if (err) {
      const error = {
        errorMessage: "error when querying",
        error: JSON.stringify(err, null, 2),
      };
      console.log(error);
      res.status(500).json(error);
    } else {
      console.log("Query succeeded.");
      res.json(data);
    }
  });
});

let moviedata = [];

const getDataFromS3Bucket = async () => {
  console.log(
    "Loading movies before starting server, this may take a while..."
  );
  const s3 = new AWS.S3();
  const getParams = {
    Bucket: "csu44000assignment220",
    Key: "moviedata.json",
  };

  s3.getObject(getParams, function (err, data) {
    // Handle any error and exit
    if (err) {
      console.log("An error occured fetching movies:", err);
      process.exit(-1);
    }

    moviedata = JSON.parse(data.Body.toString("utf-8"));
    console.log(`${moviedata.length} Movies successfully loaded, starting server...`);
    // Launch server - enables API endpoints.
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  });
};

getDataFromS3Bucket();
