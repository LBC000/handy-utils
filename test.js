const { ok, fail, clearOkCache } = require("./src/responseHelper");

function testResponseHelper() {
  console.log("--- test ok with string ---");
  console.log(ok("Operation successful"));

  console.log("--- test ok with data and date conversion ---");
  const inputData = {
    data: [
      { createdAt: new Date("2023-01-01T00:00:00Z"), updatedAt: Date.now() },
      { createdAt: "2023-07-08T12:34:56Z" },
    ],
  };
  console.log(ok(inputData, { timezone: "UTC" }));

  console.log("--- test fail with string ---");
  console.log(fail("Something failed"));

  console.log("--- test fail with object ---");
  console.log(
    fail({ msg: "Error occurred", code: 500, data: { reason: "test" } })
  );

  console.log("--- test clearOkCache ---");
  clearOkCache();
  console.log("Cache cleared");
}

function runAllTests() {
  testResponseHelper();
}

runAllTests();
