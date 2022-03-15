const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDbObjectIntoResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectIntoResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectIntoResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(convertStateDbObjectIntoResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtId,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES (${districtName},${stateId},${cases},${cured},${active},${deaths});`;
  const databaseResponse = await database.run(addDistrictQuery);
  const districtId = databaseResponse.lastID;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictName = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const district = await database.get(getDistrictName);
  response.send(convertDistrictDbObjectIntoResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetails = `
  UPDATE district
  SET
    district_name = ${districtName},
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};`;
  await database.run(updateDistrictDetails);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsOfState = `
    SELECT
         SUM(cases),
         SUM(cured),
         SUM(active),
         SUM(deaths)
    FROM
      district
    WHERE
      stare_id='${stateId}';`;
  const state = await database.get(getStatisticsOfState);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
