// example utcDateString "2018-11-12 12:00:00"
export const utcToLocal = (utcDateString) => {
  const local = new Date(`${utcDateString} UTC`);
  return `${local.getDate()}.${
    local.getMonth() + 1 < 10 ? "0" + (local.getMonth() + 1) : local.getMonth()
  }.${local.getFullYear()} ${
    local.getHours() < 10 ? "0" + local.getHours() : local.getHours()
  }:${local.getMinutes() < 10 ? "0" + local.getMinutes() : local.getMinutes()}`;
};
