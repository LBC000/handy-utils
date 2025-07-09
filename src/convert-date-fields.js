const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const dateFieldsCache = new Map();

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

/**
 * 递归转换对象或数组中的日期字段为指定时区格式
 * @param {*} input - 原始数据（对象或数组）
 * @param {*} options
 * @param {boolean} [options.convertDates=true] 是否启用转换
 * @param {string} [options.timezone="Asia/Shanghai"] 目标时区
 * @param {string[]} [options.dateFields=["createdAt", "updatedAt"]] 要转换的字段名
 * @returns {*} 转换后的数据
 */
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

function clearDateFieldsCache() {
  dateFieldsCache.clear();
}

module.exports = {
  convertDateFields,
  clearDateFieldsCache,
};
