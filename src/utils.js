import { error_with, asciiize } from "@namestone/ezccip";
import { namesplit } from "@resolverworks/enson";

export { error_with };

// TODO: maybe move this to enson
// also could add Node.baseset([name, ...])
export function drop_base(base, name) {
  if (!base) return name;
  let labels = namesplit(name);
  let take = labels.length;
  for (let i = take - 1; i >= 0; i--) {
    base = base.get(labels[i]);
    if (!base) break; // unknown basename
    if (base.is_base) take = i; // remember match
  }
  return labels.slice(0, take).join(".");
}

export function safe_name(s) {
  return `"${asciiize(s)}"`;
}

export function curlyquote(s) {
  return `“${s}”`;
}

export function log(...a) {
  let date = new Date();
  let time = date.toLocaleTimeString(undefined, { hour12: false });
  date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
  console.log(date, time, ...a);
}

export function is_null_hex(s) {
  return !s || /^(0x)?0*$/i.test(s);
}

export function is_address(s) {
  return typeof s === "string" && s.length == 42 && is_hex(s);
}

export function nth_label(s, skip = 0) {
  if (!s) return;
  //return s.split('.').at(skip)
  if (skip < 0) {
    let last = s.length;
    let prev = s.lastIndexOf(".");
    while (skip < -1) {
      if (prev == -1) return;
      last = prev;
      prev = s.lastIndexOf(".", last - 1);
      ++skip;
    }
    return prev < 0 ? s.slice(0, last) : s.slice(prev + 1, last);
  } else {
    let last = 0;
    let next = s.indexOf(".");
    while (skip > 0) {
      if (next == -1) return;
      last = next + 1;
      next = s.indexOf(".", last);
      --skip;
    }
    return next < 0 ? s.slice(last) : s.slice(last, next);
  }
}
