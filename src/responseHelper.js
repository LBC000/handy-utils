const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// 缓存日期字段集合，提高 Set 查找性能
const dateFieldsCache = new Map();

// 判断是否为纯对象
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

// 转换日期字段
function convertDateFields(
  input,
  {
    convertDates = true,
    timezone = "Asia/Shanghai",
    dateFields = ["createdAt", "updatedAt"],
  } = {}
) {
  if (!convertDates || input === null || input === undefined) return input;

  const cacheKey = dateFields.join(",");
  let dateFieldsSet = dateFieldsCache.get(cacheKey);
  if (!dateFieldsSet) {
    dateFieldsSet = new Set(dateFields);
    dateFieldsCache.set(cacheKey, dateFieldsSet);
  }

  const isRootArray = Array.isArray(input);
  if (!isRootArray && typeof input !== "object") return input;

  const visited = new WeakMap();
  const stack = [];
  const result = isRootArray ? new Array(input.length) : {};

  visited.set(input, result);

  if (isRootArray) {
    for (let i = 0; i < input.length; i++) {
      stack.push({ source: input[i], target: result, key: i });
    }
  } else {
    for (const key of Object.keys(input)) {
      stack.push({ source: input[key], target: result, key });
    }
  }

  while (stack.length > 0) {
    const { source, target, key } = stack.pop();

    if (source && typeof source === "object") {
      if (visited.has(source)) {
        target[key] = visited.get(source);
        continue;
      }

      const isArr = Array.isArray(source);
      const isPlain = isPlainObject(source);

      if (!isArr && !isPlain) {
        if (typeof source.toJSON === "function") {
          target[key] = source.toJSON();
        } else {
          target[key] = source;
        }
        continue;
      }

      const newTarget = isArr ? new Array(source.length) : {};
      target[key] = newTarget;
      visited.set(source, newTarget);

      for (const k of Object.keys(source)) {
        const v = source[k];
        if (dateFieldsSet.has(k) && v) {
          if (
            typeof v === "string" ||
            typeof v === "number" ||
            v instanceof Date
          ) {
            const parsed = dayjs(v);
            if (parsed.isValid()) {
              newTarget[k] = parsed.tz(timezone).format("YYYY-MM-DD HH:mm:ss");
              continue;
            }
          }
        }

        if (v && typeof v === "object") {
          stack.push({ source: v, target: newTarget, key: k });
        } else {
          newTarget[k] = v;
        }
      }
    } else {
      target[key] = source;
    }
  }

  return result;
}

function ok(input, options) {
  let msg = "success";
  let code = 0;
  let data = null;
  let convertDates = true;
  let tz = "Asia/Shanghai";
  let dateFields = ["createdAt", "updatedAt"];

  if (typeof input === "string") {
    msg = input;
    if (options) {
      convertDates =
        options.convertDates !== undefined ? options.convertDates : true;
      tz = options.timezone || "Asia/Shanghai";
      dateFields = options.dateFields || ["createdAt", "updatedAt"];
    }
  } else {
    msg = input.msg || "success";
    code = input.code !== undefined ? input.code : 0;
    data = input.data !== undefined ? input.data : null;
    convertDates = input.convertDates !== undefined ? input.convertDates : true;
    tz = input.timezone || "Asia/Shanghai";
    dateFields = input.dateFields || ["createdAt", "updatedAt"];
  }

  const res = { msg, code };
  if (data !== null && data !== undefined) {
    res.data = convertDateFields(data, {
      convertDates,
      timezone: tz,
      dateFields,
    });
  }
  return res;
}

function clearOkCache() {
  dateFieldsCache.clear();
}

function fail(input) {
  let msg = "fail";
  let code = 400;
  let data = null;

  if (typeof input === "string") {
    msg = input;
  } else if (typeof input === "object" && input !== null) {
    msg = input.msg || "fail";
    code = input.code !== undefined ? input.code : 400;
    data = input.data !== undefined ? input.data : null;
  }

  const res = { code, msg };
  if (data !== null && data !== undefined) {
    res.data = data;
  }
  return res;
}

module.exports = {
  ok,
  fail,
  clearOkCache,
};
