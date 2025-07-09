const {
  convertDateFields,
  clearDateFieldsCache,
} = require("./src/convert-date-fields");

function testResponseHelper() {
  console.log("--- test ok with string ---");
  console.log(convertDateFields("Operation successful"));

  console.log("--- test ok with data and date conversion ---");
  const inputData = {
    data: [
      { createdAt: new Date("2023-01-01T00:00:00Z"), updatedAt: Date.now() },
      { createdAt: "2023-07-08T12:34:56Z" },
    ],
  };
  console.log(convertDateFields(inputData, { timezone: "UTC" }));

  console.log("--- test clearOkCache ---");
  clearDateFieldsCache();
  console.log("Cache cleared");
}

function runAllTests() {
  testResponseHelper();
}

runAllTests();
